import { type ReactNode, useState } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target, Wallet,
  Settings, LogOut, Menu, FileBarChart, Tags, Plus, Sparkles, Bell, Search,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  { to: "/dashboard", label: "Dasbor", icon: LayoutDashboard, tint: "bg-amber-500/15 text-amber-600" },
  { to: "/transactions", label: "Transaksi", icon: ArrowLeftRight, tint: "bg-sky-500/15 text-sky-500" },
  { to: "/categories", label: "Kategori", icon: Tags, tint: "bg-orange-500/15 text-orange-500" },
  { to: "/budgets", label: "Anggaran", icon: PieChart, tint: "bg-amber-500/15 text-amber-500" },
  { to: "/goals", label: "Tabungan", icon: Target, tint: "bg-emerald-500/15 text-emerald-500" },
  { to: "/reports", label: "Laporan", icon: FileBarChart, tint: "bg-rose-500/15 text-rose-500" },
  { to: "/settings", label: "Pengaturan", icon: Settings, tint: "bg-slate-500/15 text-slate-500" },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1.5 px-3">
      {nav.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-all",
                active ? "bg-white/20 text-primary-foreground" : item.tint,
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary via-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/30">
        <Wallet className="h-5 w-5" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="text-base font-extrabold tracking-tight">Saku Ku</div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Finansial Cerdas</div>
      </div>
    </div>
  );
}

function UpgradeCard() {
  return (
    <div className="mx-3 mb-4 mt-auto rounded-3xl bg-gradient-to-br from-slate-900 via-stone-800 to-slate-900 p-5 text-white relative overflow-hidden">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/40 blur-2xl" />
      <div className="absolute -left-4 -bottom-6 h-20 w-20 rounded-full bg-amber-500/30 blur-2xl" />
      <div className="relative">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
          <Sparkles className="h-3 w-3" /> Saku Pro
        </div>
        <p className="text-sm font-semibold leading-snug">Buka analisis keuangan cerdas & laporan tanpa batas.</p>
        <button className="mt-4 w-full rounded-xl bg-white py-2 text-xs font-bold text-slate-900 shadow-lg transition-transform hover:scale-[1.02]">
          Coba Gratis
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-sidebar-border/60 bg-sidebar/80 backdrop-blur-xl">
        <Brand />
        <NavList />
        <UpgradeCard />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-sidebar flex flex-col">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <Brand />
              <NavList onNavigate={() => setOpen(false)} />
              <UpgradeCard />
            </SheetContent>
          </Sheet>

          {/* Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari transaksi, kategori..."
                className="w-full rounded-2xl border border-border/70 bg-background/50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          <button className="relative grid h-10 w-10 place-items-center rounded-2xl border border-border/70 bg-background/50 text-muted-foreground transition-colors hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background" />
          </button>

          <Link to="/transactions">
            <Button size="sm" className="hidden sm:inline-flex gap-2 rounded-2xl bg-gradient-to-r from-primary to-amber-500 shadow-lg shadow-primary/25 hover:opacity-95">
              <Plus className="h-4 w-4" /> Transaksi
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-2xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-10 w-10 rounded-2xl border-2 border-background shadow-md">
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-primary-foreground text-sm font-bold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl">
              <DropdownMenuLabel className="truncate">
                <div className="font-medium">{user?.user_metadata?.full_name || "Pengguna"}</div>
                <div className="text-xs font-normal text-muted-foreground truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.navigate({ to: "/settings" })}>
                <Settings className="h-4 w-4 mr-2" /> Pengaturan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>

        {/* Floating action button on mobile */}
        <Link
          to="/transactions"
          className="sm:hidden fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-primary-foreground shadow-xl shadow-primary/40 active:scale-95 transition-transform"
          aria-label="Tambah Transaksi"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}
