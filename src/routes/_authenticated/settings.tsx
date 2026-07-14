import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Moon, Sun, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Saku Ku" }] }),
  component: SettingsPage,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Wajib").max(80),
});
const passSchema = z.object({
  password: z.string().min(6, "Minimal 6 karakter"),
});

function SettingsPage() {
  const { user } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("fintrack-theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("fintrack-theme", v ? "dark" : "light");
  };

  const pf = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.user_metadata?.full_name ?? "" },
  });
  useEffect(() => {
    if (user?.user_metadata?.full_name) pf.reset({ full_name: user.user_metadata.full_name });
  }, [user, pf]);

  const saveProfile = async (v: z.infer<typeof profileSchema>) => {
    const { error: uErr } = await supabase.auth.updateUser({ data: { full_name: v.full_name } });
    if (uErr) { toast.error(uErr.message); return; }
    const { error: pErr } = await supabase.from("profiles").update({ full_name: v.full_name }).eq("id", user!.id);
    if (pErr) { toast.error(pErr.message); return; }
    toast.success("Profil diperbarui");
  };

  const ps = useForm<z.infer<typeof passSchema>>({ resolver: zodResolver(passSchema) });
  const changePassword = async (v: z.infer<typeof passSchema>) => {
    const { error } = await supabase.auth.updateUser({ password: v.password });
    if (error) { toast.error(error.message); return; }
    toast.success("Kata sandi diperbarui");
    ps.reset({ password: "" });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola akun & preferensi aplikasi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>Sesuaikan mode terang atau gelap</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <div>
              <div className="font-medium">Mode Gelap</div>
              <div className="text-xs text-muted-foreground">{dark ? "Aktif" : "Nonaktif"}</div>
            </div>
          </div>
          <Switch checked={dark} onCheckedChange={toggleTheme} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={pf.handleSubmit(saveProfile)} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input {...pf.register("full_name")} />
              {pf.formState.errors.full_name && <p className="text-xs text-destructive">{pf.formState.errors.full_name.message}</p>}
            </div>
            <Button type="submit" disabled={pf.formState.isSubmitting}>
              {pf.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan Profil
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ganti Kata Sandi</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={ps.handleSubmit(changePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label>Kata Sandi Baru</Label>
              <Input type="password" {...ps.register("password")} />
              {ps.formState.errors.password && <p className="text-xs text-destructive">{ps.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={ps.formState.isSubmitting}>
              {ps.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Perbarui
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mata Uang</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Saat ini menggunakan <span className="font-semibold text-foreground">Rupiah (IDR)</span>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
