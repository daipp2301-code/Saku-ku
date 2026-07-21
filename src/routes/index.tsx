import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import {
  Wallet, ArrowRight, TrendingUp, TrendingDown, PiggyBank, ShieldCheck,
  BarChart3, PieChart, CheckCircle2, ArrowUpRight, ArrowDownRight, Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Saku Ku — Atur Pemasukan Dan Pengeluaran" },
      { name: "description", content: "Aplikasi pengelola keuangan pribadi. Kelola pemasukan, pengeluaran, anggaran, dan tabungan dalam satu platform cerdas." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-foreground selection:text-background">
      {/* Background grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 animate-landing-grid z-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.5 0 0 / 6%) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.5 0 0 / 6%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top Header Navigation */}
      <header className="relative z-20 flex h-20 items-center justify-between px-6 md:px-12 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background shadow-md">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-black tracking-tight">Saku Ku</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            search={{ tab: "login" }}
            id="nav-masuk-btn"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground/80 hover:text-foreground hover:bg-accent/60 transition-all"
          >
            Masuk
          </Link>
          <Link
            to="/auth"
            search={{ tab: "register" }}
            id="nav-daftar-btn"
            className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-md hover:bg-foreground/90 transition-all active:scale-95"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center">
        <section className="w-full max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28 flex flex-col items-center text-center">
          
          {/* Subtle badge */}
          <div className="animate-landing-slide-up mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-sm backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> Pelacak Keuangan Cerdas
          </div>

          {/* Main heading */}
          <h1 className="animate-landing-slide-up landing-delay-1 text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl md:text-7xl max-w-4xl">
            Atur Pemasukan
            <br />
            <span className="relative inline-block">
              Dan Pengeluaran
              <span className="absolute -bottom-2 left-0 h-1.5 w-full rounded-full bg-foreground/20" />
            </span>
            <span className="text-muted-foreground/60 font-medium">?</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-landing-slide-up landing-delay-2 mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
            Kelola arus kas pribadi Anda dalam balutan desain <strong className="text-foreground font-bold">Modern Premium</strong>. 
            Pantau saldo, analisis pengeluaran, buat anggaran, dan capai target tabungan secara terukur.
          </p>

          {/* Main Action Buttons */}
          <div className="animate-landing-slide-up landing-delay-3 mt-10 flex flex-col items-center gap-4 sm:flex-row w-full sm:w-auto">
            <Link
              to="/auth"
              search={{ tab: "login" }}
              id="hero-masuk-btn"
              className="group relative flex h-14 w-full sm:w-56 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-foreground px-8 text-base font-extrabold text-background shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Masuk</span>
              <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>

            <Link
              to="/auth"
              search={{ tab: "register" }}
              id="hero-daftar-btn"
              className="group flex h-14 w-full sm:w-56 items-center justify-center gap-3 rounded-2xl border-2 border-foreground/20 bg-card/70 px-8 text-base font-extrabold text-foreground backdrop-blur-md transition-all hover:border-foreground/40 hover:bg-card hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Daftar Akun</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 text-muted-foreground" />
            </Link>
          </div>

          <p className="animate-landing-slide-up landing-delay-4 mt-6 text-xs text-muted-foreground">
            Akses Penuh · Tanpa Biaya Tersembunyi · Privasi Terjamin
          </p>

          {/* Interactive Mockup Preview Card */}
          <div className="animate-landing-slide-up landing-delay-4 mt-16 w-full max-w-4xl rounded-3xl border border-border/80 bg-card/90 p-4 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden text-left">
            <div className="flex items-center justify-between pb-6 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground/20" />
                <div className="h-3 w-3 rounded-full bg-foreground/15" />
                <div className="h-3 w-3 rounded-full bg-foreground/10" />
                <span className="ml-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pratinjau Dashboard Saku Ku</span>
              </div>
              <div className="text-xs font-semibold px-3 py-1 rounded-full bg-foreground/8 border border-border/60">
                
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mt-6">
              {/* Card 1: Saldo */}
              <div className="rounded-2xl bg-foreground text-background p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest opacity-70">Total Saldo Bersih</span>
                  <h3 className="text-3xl font-black mt-2 tracking-tight">Rp 24.850.000</h3>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-medium opacity-80 pt-4 border-t border-background/20">
                  <span>+12.5% bulan ini</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>

              {/* Card 2: Pemasukan */}
              <div className="rounded-2xl border border-border/80 bg-background/80 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] uppercase font-extrabold tracking-widest">Pemasukan</span>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <h3 className="text-2xl font-black mt-2 tracking-tight">Rp 18.500.000</h3>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Gaji, Investasi & Project</div>
              </div>

              {/* Card 3: Pengeluaran */}
              <div className="rounded-2xl border border-border/80 bg-background/80 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] uppercase font-extrabold tracking-widest">Pengeluaran</span>
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <h3 className="text-2xl font-black mt-2 tracking-tight">Rp 6.350.000</h3>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Kebutuhan, Angsuran & Belanja</div>
              </div>
            </div>

            {/* Mock recent list */}
            <div className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Transaksi Terakhir</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm py-2 px-3 rounded-xl bg-card border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/10 font-bold text-xs">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold">Pembayaran Project Freelance</div>
                      <div className="text-xs text-muted-foreground">Pemasukan • Hari ini</div>
                    </div>
                  </div>
                  <div className="font-extrabold text-foreground">+ Rp 4.500.000</div>
                </div>
                <div className="flex items-center justify-between text-sm py-2 px-3 rounded-xl bg-card border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/10 font-bold text-xs">
                      <ArrowDownRight className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold">Belanja Bulanan Supermarket</div>
                      <div className="text-xs text-muted-foreground">Pengeluaran • Kemarin</div>
                    </div>
                  </div>
                  <div className="font-extrabold text-muted-foreground">- Rp 850.000</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars / Features Section */}
        <section className="w-full bg-card/50 border-t border-b border-border/60 py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Fitur Unggulan</h2>
              <p className="text-muted-foreground mt-3 text-base">Semua kebutuhan manajemen keuangan pribadi Anda dalam tata letak yang bersih dan fokus.</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={BarChart3}
                title="Pencatatan Cepat"
                desc="Input transaksi bulanan, kategori, dan metode pembayaran hanya dalam beberapa detik."
              />
              <FeatureCard
                icon={PieChart}
                title="Laporan Analitis"
                desc="Grafik visualisasi ringkas dan ekspor data langsung ke format PDF, Excel, atau CSV."
              />
              <FeatureCard
                icon={Layers}
                title="Anggaran Terukur"
                desc="Batasi alokasi pengeluaran per kategori agar tidak melebihi batas keuangan bulanan."
              />
              <FeatureCard
                icon={PiggyBank}
                title="Target Tabungan"
                desc="Atur tujuan dana darurat, impian liburan, atau pembelian aset dengan indikator progres presisi."
              />
            </div>
          </div>
        </section>

        {/* CTA Bottom Banner */}
        <section className="w-full max-w-4xl px-6 py-20 text-center">
          <div className="rounded-3xl bg-foreground text-background p-8 md:p-14 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Siap Memulai Kelola Keuangan?
            </h2>
            <p className="mt-4 text-background/80 text-base sm:text-lg max-w-xl mx-auto">
              Gabung sekarang dan nikmati pengalaman mencatat keuangan pribadi dengan tema yang elegan.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth"
                search={{ tab: "register" }}
                className="w-full sm:w-auto rounded-2xl bg-background text-foreground font-black px-8 py-4 text-base shadow-lg hover:bg-background/90 transition-all"
              >
                Buat Akun Sekarang
              </Link>
              <Link
                to="/auth"
                search={{ tab: "login" }}
                className="w-full sm:w-auto rounded-2xl border-2 border-background/30 text-background font-bold px-8 py-4 text-base hover:bg-background/10 transition-all"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 py-8 px-6 text-center text-xs text-muted-foreground bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Wallet className="h-4 w-4" /> Saku Ku —  New Edition
          </div>
          <div>© {new Date().getFullYear()} Saku Ku. Hak Cipta Dilindungi.</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon, title, desc,
}: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:border-foreground/40 hover:shadow-md">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background mb-5 shadow-md">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
