import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Filter, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTransactions, useCategories, type Transaction } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, formatDate, monthNames } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transaksi — Saku Ku" }] }),
  component: TransactionsPage,
});

const schema = z.object({
  date: z.string().min(1, "Wajib diisi"),
  type: z.enum(["income", "expense"]),
  category_id: z.string().min(1, "Pilih kategori"),
  product: z.string().trim().max(100).optional(),
  description: z.string().trim().max(200).optional(),
  amount: z.coerce.number().positive("Harus lebih dari 0"),
  payment_method: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
});
type FormVals = z.infer<typeof schema>;

const PAGE_SIZE = 10;
const paymentMethods = ["Tunai", "Debit", "Kredit", "Transfer Bank", "E-Wallet", "Lainnya"];

function TransactionsPage() {
  const { data: txs, isLoading } = useTransactions();
  const { data: cats } = useCategories();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const years = useMemo(() => {
    const s = new Set<number>();
    (txs ?? []).forEach((t) => s.add(new Date(t.date).getFullYear()));
    return Array.from(s).sort((a, b) => b - a);
  }, [txs]);

  const filtered = useMemo(() => {
    let rows = txs ?? [];
    if (filterType !== "all") rows = rows.filter((r) => r.type === filterType);
    if (filterCategory !== "all") rows = rows.filter((r) => r.category_id === filterCategory);
    if (filterMonth !== "all") rows = rows.filter((r) => new Date(r.date).getMonth() === Number(filterMonth));
    if (filterYear !== "all") rows = rows.filter((r) => new Date(r.date).getFullYear() === Number(filterYear));
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        (r.product ?? "").toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.notes ?? "").toLowerCase().includes(q));
    }
    return rows;
  }, [txs, filterType, filterCategory, filterMonth, filterYear, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Transaksi</h1>
          <p className="text-sm text-muted-foreground">Kelola semua pemasukan dan pengeluaran Anda</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Tambah Transaksi</Button>
          </DialogTrigger>
          <TransactionFormDialog
            editing={editing}
            categories={cats ?? []}
            onClose={() => { setOpen(false); setEditing(null); }}
          />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari produk, deskripsi…" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
              <SelectTrigger><Filter className="h-3 w-3 mr-1" /><SelectValue placeholder="Tipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {(cats ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={(v) => { setFilterMonth(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Bulan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Tahun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="hidden lg:table-cell">Metode</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                )) : pageRows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    Belum ada transaksi. Klik "Tambah Transaksi" untuk memulai.
                  </TableCell></TableRow>
                ) : pageRows.map((t) => {
                  const cat = cats?.find((c) => c.id === t.category_id);
                  const isIncome = t.type === "income";
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(t.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "gap-1 border px-2.5 py-0.5 text-xs font-bold rounded-xl",
                          isIncome ? "bg-foreground text-background border-foreground"
                                   : "bg-accent/60 text-foreground/70 border-border/80")}>
                          {isIncome ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                          {isIncome ? "Masuk" : "Keluar"}
                        </Badge>
                      </TableCell>
                      <TableCell>{cat?.name ?? "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{t.product ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">{t.description ?? "—"}</TableCell>
                      <TableCell className={cn("text-right font-extrabold whitespace-nowrap tabular-nums",
                        isIncome ? "text-foreground" : "text-muted-foreground")}>
                        {isIncome ? "+" : "−"} {formatRupiah(t.amount)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{t.payment_method ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DeleteDialog id={deleteId} onDone={() => setDeleteId(null)} />
      </AlertDialog>
    </div>
  );
}

function TransactionFormDialog({
  editing, categories, onClose,
}: { editing: Transaction | null; categories: ReturnType<typeof useCategories>["data"]; onClose: () => void }) {
  const qc = useQueryClient();
  const cats = categories ?? [];

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: editing ? {
      date: editing.date,
      type: editing.type,
      category_id: editing.category_id ?? "",
      product: editing.product ?? "",
      description: editing.description ?? "",
      amount: editing.amount,
      payment_method: editing.payment_method ?? "",
      notes: editing.notes ?? "",
    } : {
      date: new Date().toISOString().slice(0, 10),
      type: "expense",
      category_id: "",
      amount: 0,
    },
  });

  const type = watch("type");

  const save = useMutation({
    mutationFn: async (vals: FormVals) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Tidak terautentikasi");
      const payload = { ...vals, user_id: u.user.id };
      if (editing) {
        const { error } = await supabase.from("transactions").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(editing ? "Transaksi diperbarui" : "Transaksi ditambahkan");
      reset();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Transaksi" : "Tambah Transaksi"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select value={type} onValueChange={(v) => { setValue("type", v as "income" | "expense"); setValue("category_id", ""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select value={watch("category_id")} onValueChange={(v) => setValue("category_id", v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent>
              {cats.filter((c) => c.type === type).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Nama Produk / Item</Label>
          <Input {...register("product")} placeholder="cth. Kopi, Gaji Bulanan" />
        </div>
        <div className="space-y-2">
          <Label>Jumlah (Rp)</Label>
          <Input type="number" min="0" step="1000" {...register("amount")} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Metode Pembayaran</Label>
          <Select value={watch("payment_method") ?? ""} onValueChange={(v) => setValue("payment_method", v)}>
            <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
            <SelectContent>
              {paymentMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Deskripsi</Label>
          <Input {...register("description")} placeholder="Deskripsi singkat" />
        </div>
        <div className="space-y-2">
          <Label>Catatan</Label>
          <Textarea rows={2} {...register("notes")} placeholder="Catatan tambahan (opsional)" />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={isSubmitting || save.isPending}>
            {editing ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteDialog({ id, onDone }: { id: string | null; onDone: () => void }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaksi dihapus");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
        <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onDone}>Batal</AlertDialogCancel>
        <AlertDialogAction onClick={() => del.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Hapus
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
