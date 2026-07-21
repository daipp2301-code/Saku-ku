import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Tags } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCategories } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({ meta: [{ title: "Kategori — Saku Ku" }] }),
  component: CategoriesPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Wajib").max(40),
  type: z.enum(["income", "expense"]),
});

function CategoriesPage() {
  const { data: cats } = useCategories();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense" },
  });

  const create = useMutation({
    mutationFn: async (v: z.infer<typeof schema>) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Tidak terautentikasi");
      const { error } = await supabase.from("categories").insert({ ...v, user_id: u.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori ditambahkan");
      reset({ name: "", type: "expense" });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Kategori dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const income = (cats ?? []).filter((c) => c.type === "income");
  const expense = (cats ?? []).filter((c) => c.type === "expense");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kategori</h1>
          <p className="text-sm text-muted-foreground">Atur kategori untuk pemasukan & pengeluaran Anda</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Tambah Kategori</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Kategori</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v as "income" | "expense")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit" disabled={create.isPending}>Tambah</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryList title="Pemasukan" items={income} onDelete={(id) => del.mutate(id)} tone="income" />
        <CategoryList title="Pengeluaran" items={expense} onDelete={(id) => del.mutate(id)} tone="expense" />
      </div>
    </div>
  );
}

function CategoryList({
  title, items, onDelete, tone,
}: { title: string; items: NonNullable<ReturnType<typeof useCategories>["data"]>; onDelete: (id: string) => void; tone: "income" | "expense" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-4 w-4 text-foreground/80" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((c) => (
              <Badge key={c.id} variant="secondary" className="gap-2 py-1.5 px-3 text-sm">
                {c.name}
                {c.is_default && <span className="text-[10px] text-muted-foreground">(default)</span>}
                <button onClick={() => onDelete(c.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
