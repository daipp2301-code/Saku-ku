import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, Receipt, ArrowDownCircle, ArrowUpCircle,
  Sparkles, ArrowUpRight, ArrowDownRight, Plus, ArrowRight,
} from "lucide-react";

import { useTransactions, useCategories } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { formatRupiah, monthNames } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dasbor — Saku Ku" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pengguna").split(" ")[0];
  const { data: txs, isLoading } = useTransactions();
  const { data: cats } = useCategories();

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const summary = useMemo(() => {
    const t = txs ?? [];
    let income = 0, expense = 0, monthIncome = 0, monthExpense = 0;
    for (const x of t) {
      const d = new Date(x.date);
      if (x.type === "income") income += x.amount;
      else expense += x.amount;
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        if (x.type === "income") monthIncome += x.amount;
        else monthExpense += x.amount;
      }
    }
    return { income, expense, balance: income - expense, count: t.length, monthIncome, monthExpense };
  }, [txs, thisMonth, thisYear]);

  const monthly = useMemo(() => {
    const map = new Map<string, { name: string; income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, { name: monthNames[d.getMonth()].slice(0, 3), income: 0, expense: 0 });
    }
    for (const x of txs ?? []) {
      const d = new Date(x.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const row = map.get(key);
      if (!row) continue;
      if (x.type === "income") row.income += x.amount;
      else row.expense += x.amount;
    }
    return Array.from(map.values());
  }, [txs, thisMonth, thisYear]);

  const cashflow = useMemo(
    () => monthly.map((m) => ({ name: m.name, value: m.income - m.expense })),
    [monthly],
  );

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const x of txs ?? []) {
      if (x.type !== "expense") continue;
      const cat = cats?.find((c) => c.id === x.category_id);
      const name = cat?.name ?? "Lainnya";
      map.set(name, (map.get(name) ?? 0) + x.amount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [txs, cats]);

  const recent = useMemo(() => (txs ?? []).slice(0, 5), [txs]);

  const pieColors = ["#111111", "#333333", "#555555", "#777777", "#999999", "#bbbbbb", "#dddddd", "#444444"];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Halo, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan keuanganmu di {monthNames[thisMonth]} {thisYear}</p>
        </div>
      </div>

      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground via-neutral-700 to-neutral-800 p-6 md:p-8 text-background shadow-2xl shadow-foreground/15">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-16 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
              <Sparkles className="h-3 w-3" /> Saldo Aktif
            </div>
            <p className="mt-4 text-4xl md:text-5xl font-black tracking-tight">{formatRupiah(summary.balance)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold backdrop-blur">
                <ArrowUpRight className="h-3 w-3 text-white/70" />
                Masuk bulan ini {formatRupiah(summary.monthIncome)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-semibold backdrop-blur">
                <ArrowDownRight className="h-3 w-3 text-white/50" />
                Keluar {formatRupiah(summary.monthExpense)}
              </span>
            </div>
          </div>
          <div className="flex gap-2 md:justify-end">
            <Link to="/transactions">
              <Button size="sm" className="rounded-2xl bg-white text-foreground hover:bg-white/95 gap-2 shadow-lg">
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            </Link>
            <Link to="/reports">
              <Button size="sm" variant="outline" className="rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur gap-2">
                Laporan <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pemasukan" value={summary.income} icon={ArrowUpCircle} tone="income" />
        <StatCard label="Total Pengeluaran" value={summary.expense} icon={ArrowDownCircle} tone="expense" />
        <StatCard label="Pemasukan Bulan Ini" value={summary.monthIncome} icon={TrendingUp} tone="income" />
        <StatCard label="Pengeluaran Bulan Ini" value={summary.monthExpense} icon={TrendingDown} tone="expense" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-3xl border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-foreground/8 text-foreground/70">
                <TrendingUp className="h-5 w-5" />
              </span>
              <CardTitle className="text-base md:text-lg">Pemasukan vs Pengeluaran</CardTitle>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">6 bulan</span>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Pemasukan" fill="var(--income)" radius={[10, 10, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="var(--expense)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-foreground/8 text-foreground/70">
              <PieChart className="h-5 w-5" />
            </span>
            <CardTitle className="text-base md:text-lg">Distribusi Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {categoryData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {categoryData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--card)" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cashflow area + Recent */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-3xl border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-foreground/8 text-foreground/70">
              <Wallet className="h-5 w-5" />
            </span>
            <CardTitle className="text-base md:text-lg">Arus Kas Bersih</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflow}>
                <defs>
                  <linearGradient id="cashflowFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: 16, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#cashflowFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-foreground/8 text-foreground/70">
                <Receipt className="h-5 w-5" />
              </span>
              <CardTitle className="text-base md:text-lg">Terbaru</CardTitle>
            </div>
            <Link to="/transactions" className="text-xs font-bold text-primary hover:underline">
              Semua
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <div className="grid place-items-center py-10 text-sm text-muted-foreground">Belum ada transaksi</div>
            ) : recent.map((t) => {
              const cat = cats?.find((c) => c.id === t.category_id);
              const isIncome = t.type === "income";
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl p-2 -mx-2 transition-colors hover:bg-accent/50">
                  <span className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                    isIncome ? "bg-foreground/8 text-foreground/70" : "bg-foreground/8 text-foreground/50"
                  )}>
                    {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.product || t.description || cat?.name || "Transaksi"}</p>
                    <p className="truncate text-[11px] font-medium text-muted-foreground">
                      {cat?.name ?? "Tanpa kategori"} • {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <p className={cn(
                    "shrink-0 text-sm font-bold tabular-nums",
                    isIncome ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {isIncome ? "+" : "-"} {formatRupiah(t.amount)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "income" | "expense" | "neutral";
}) {
  const chip =
    tone === "income" ? "bg-foreground/8 text-foreground/70" :
    tone === "expense" ? "bg-foreground/8 text-foreground/50" :
    "bg-foreground/8 text-foreground/70";
  return (
    <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className={cn("grid h-11 w-11 place-items-center rounded-2xl mb-4", chip)}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-lg md:text-xl font-extrabold tracking-tight truncate">{formatRupiah(value)}</p>
      </CardContent>
    </Card>
  );
}
