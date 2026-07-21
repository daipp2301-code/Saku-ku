import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Wallet, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Minimal 6 karakter"),
});
const registerSchema = loginSchema.extend({
  full_name: z.string().trim().min(2, "Minimal 2 karakter").max(80),
});
const forgotSchema = z.object({ email: z.string().email("Email tidak valid") });

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Masuk — Saku Ku" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab === "register" ? "register" : "login") as "login" | "register",
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<"login" | "register" | "forgot">(initialTab);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Kembali ke Beranda
        </Link>
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-foreground text-background shadow-lg">
            <Wallet className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight">Saku Ku</span>
        </div>
        <Card className="border-border/60 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {tab === "login" && "Masuk ke akun"}
              {tab === "register" && "Buat akun baru"}
              {tab === "forgot" && "Lupa kata sandi"}
            </CardTitle>
            <CardDescription>
              {tab === "login" && "Kelola keuangan pribadi Anda dengan mudah."}
              {tab === "register" && "Mulai pantau pemasukan & pengeluaran Anda."}
              {tab === "forgot" && "Kami akan kirim tautan reset ke email Anda."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tab !== "forgot" ? (
              <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Masuk</TabsTrigger>
                  <TabsTrigger value="register">Daftar</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-4">
                  <LoginForm onForgot={() => setTab("forgot")} />
                </TabsContent>
                <TabsContent value="register" className="mt-4">
                  <RegisterForm onDone={() => setTab("login")} />
                </TabsContent>
              </Tabs>
            ) : (
              <ForgotForm onBack={() => setTab("login")} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: window.location.origin,
  },
});

if (error) {
  toast.error(error.message);
  setBusy(false);
}
    if (error) {
      toast.error("Gagal masuk dengan Google");
      setBusy(false);
    }
  };
  return (
    <Button type="button" variant="outline" className="w-full" onClick={handle} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          Lanjutkan dengan Google
        </>
      )}
    </Button>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Berhasil masuk");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <GoogleButton />
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">atau email</span></div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Kata Sandi</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <button type="button" onClick={onForgot} className="text-xs text-primary hover:underline">Lupa kata sandi?</button>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Masuk
      </Button>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });
  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: data.full_name },
      },
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Akun berhasil dibuat. Silakan masuk.");
    onDone();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <GoogleButton />
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">atau email</span></div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-name">Nama Lengkap</Label>
        <Input id="r-name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-email">Email</Label>
        <Input id="r-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-pass">Kata Sandi</Label>
        <Input id="r-pass" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Daftar
      </Button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
  });
  const onSubmit = async (data: z.infer<typeof forgotSchema>) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Tautan reset telah dikirim ke email Anda.");
    onBack();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="f-email">Email</Label>
        <Input id="f-email" type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Kirim tautan reset
      </Button>
      <button type="button" onClick={onBack} className="block w-full text-center text-xs text-muted-foreground hover:underline">
        Kembali ke masuk
      </button>
    </form>
  );
}
