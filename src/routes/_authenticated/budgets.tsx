import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useBudgets, useCategories, useTransactions } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, monthNames } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Anggaran — Saku Ku" }] }),
  component: BudgetsPage,
});

const schema = z.object({
  category_id: z.string().min(1, "Pilih kategori"),
  amount: z.coerce.number().positive(),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
});

function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: budgets } = useBudgets();
  const { data: cats } = useCategories();
  const { data: txs } = useTransactions();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { month, year, amount: 0, category_id: "" },
  });

  const periodBudgets = useMemo(() => (budgets ?? []).filter((b) => b.month === month && b.year === year), [budgets, month, year]);

  const spent = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txs ?? []) {
      if (t.type !== "expense" || !t.category_id) continue;
      const d = new Date(t.date);
      if (d.getMonth() + 1 !== month || d.getFullYear() !== year) continue;
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount);
    }
    return map;
  }, [txs, month, year]);

  const upsert = useMutation({
    mutationFn: async (v: z.infer<typeof schema>) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Tidak terautentikasi");
      const { error } = await supabase.from("budgets").upsert(
        { ...v, user_id: u.user.id },
        { onConflict: "user_id,category_id,month,year" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Anggaran disimpan");
      reset({ category_id: "", amount: 0, month, year });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Anggaran dihapus");
    },
  });

  const expenseCats = (cats ?? []).filter((c) => c.type === "expense");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Anggaran</h1>
          <p className="text-sm text-muted-foreground">Pantau pengeluaran terhadap anggaran bulanan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" className="w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) reset({ category_id: "", amount: 0, month, year }); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Tambah</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Tetapkan Anggaran</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((v) => upsert.mutate(v))} className="space-y-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={watch("category_id")} onValueChange={(v) => setValue("category_id", v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      {expenseCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Bulan</Label>
                    <Select value={String(watch("month"))} onValueChange={(v) => setValue("month", Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {monthNames.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun</Label>
                    <Input type="number" {...register("year")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Jumlah Anggaran (Rp)</Label>
                  <Input type="number" min="0" step="10000" {...register("amount")} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={upsert.isPending}>Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {periodBudgets.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          Belum ada anggaran untuk {monthNames[month - 1]} {year}.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {periodBudgets.map((b) => {
            const cat = cats?.find((c) => c.id === b.category_id);
            const used = spent.get(b.category_id) ?? 0;
            const pct = Math.min(100, (used / b.amount) * 100);
            const over = used > b.amount;
            return (
              <Card key={b.id} className={cn(over && "border-destructive/40")}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="truncate">{cat?.name ?? "—"}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => del.mutate(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Terpakai</span>
                    <span className="font-semibold">{formatRupiah(used)}</span>
                  </div>
                  <Progress value={pct} className={cn(over && "[&>div]:bg-destructive")} />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{pct.toFixed(0)}% dari {formatRupiah(b.amount)}</span>
                    <span className={cn("font-medium", over ? "text-destructive" : "text-[oklch(var(--income))]")}>
                      {over ? "−" : ""}{formatRupiah(Math.abs(b.amount - used))} {over ? "lebih" : "sisa"}
                    </span>
                  </div>
                  {over && (
                    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-md px-2 py-1.5">
                      <AlertTriangle className="h-3 w-3" /> Anggaran terlampaui!
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
