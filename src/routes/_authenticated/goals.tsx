import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Target, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSavingsGoals, type SavingsGoal } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Target Tabungan — Saku Ku" }] }),
  component: GoalsPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  target_amount: z.coerce.number().positive(),
  current_amount: z.coerce.number().min(0),
  deadline: z.string().optional(),
});
type FormVals = z.infer<typeof schema>;

function GoalsPage() {
  const { data: goals } = useSavingsGoals();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormVals>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", target_amount: 0, current_amount: 0, deadline: "" });
    setOpen(true);
  };
  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    reset({
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      deadline: g.deadline ?? "",
    });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async (v: FormVals) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Tidak terautentikasi");
      const payload = { ...v, deadline: v.deadline || null, user_id: u.user.id };
      if (editing) {
        const { error } = await supabase.from("savings_goals").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("savings_goals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["savings_goals"] });
      toast.success(editing ? "Target diperbarui" : "Target dibuat");
      if (vars.current_amount >= vars.target_amount) toast.success("🎉 Target tercapai!");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings_goals"] });
      toast.success("Target dihapus");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Target Tabungan</h1>
          <p className="text-sm text-muted-foreground">Buat & pantau target finansial Anda</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Target</Button>
      </div>

      {(goals ?? []).length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
          Belum ada target tabungan.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(goals ?? []).map((g) => {
            const pct = Math.min(100, (g.current_amount / g.target_amount) * 100);
            const done = g.current_amount >= g.target_amount;
            return (
              <Card key={g.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <div className="flex items-center gap-2 min-w-0">
                      {done && <CheckCircle2 className="h-4 w-4 text-[oklch(var(--income))] shrink-0" />}
                      <span className="truncate">{g.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(g)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del.mutate(g.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold">{formatRupiah(g.current_amount)}</div>
                  <div className="text-xs text-muted-foreground">dari {formatRupiah(g.target_amount)}</div>
                  <Progress value={pct} />
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-primary">{pct.toFixed(0)}%</span>
                    {g.deadline && <span className="text-muted-foreground">Tenggat: {formatDate(g.deadline)}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Target" : "Buat Target Tabungan"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Target</Label>
              <Input placeholder="cth. Liburan ke Bali" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Target (Rp)</Label>
                <Input type="number" min="0" step="100000" {...register("target_amount")} />
              </div>
              <div className="space-y-2">
                <Label>Saat Ini (Rp)</Label>
                <Input type="number" min="0" step="100000" {...register("current_amount")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tenggat (opsional)</Label>
              <Input type="date" {...register("deadline")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting || save.isPending}>Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
