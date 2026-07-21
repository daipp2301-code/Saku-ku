import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Printer, FileSpreadsheet, FileText, Download } from "lucide-react";

import { useTransactions, useCategories } from "@/lib/data";
import { formatRupiah, formatDate, monthNames } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Laporan — Saku Ku" }] }),
  component: ReportsPage,
});

type Period = "daily" | "weekly" | "monthly" | "yearly";

function ReportsPage() {
  const { data: txs } = useTransactions();
  const { data: cats } = useCategories();
  const [period, setPeriod] = useState<Period>("monthly");
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const filtered = useMemo(() => {
    const all = txs ?? [];
    return all.filter((t) => {
      const d = new Date(t.date);
      if (period === "yearly") return d.getFullYear() === year;
      if (period === "monthly") return d.getMonth() === month && d.getFullYear() === year;
      if (period === "weekly") {
        const today = new Date();
        const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
        return d >= weekAgo && d <= today;
      }
      // daily
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });
  }, [txs, period, month, year]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of filtered) {
      if (t.type === "income") income += t.amount; else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }, [filtered]);

  const exportCsv = () => {
    const headers = ["Tanggal", "Tipe", "Kategori", "Produk", "Deskripsi", "Jumlah", "Metode"];
    const rows = filtered.map((t) => [
      formatDate(t.date),
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      cats?.find((c) => c.id === t.category_id)?.name ?? "",
      t.product ?? "",
      (t.description ?? "").replace(/"/g, '""'),
      t.amount,
      t.payment_method ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "laporan-keuangan.csv");
  };

  const exportExcel = () => {
    // Tab-separated for Excel compatibility
    const headers = ["Tanggal", "Tipe", "Kategori", "Produk", "Deskripsi", "Jumlah", "Metode"];
    const rows = filtered.map((t) => [
      formatDate(t.date),
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      cats?.find((c) => c.id === t.category_id)?.name ?? "",
      t.product ?? "",
      t.description ?? "",
      t.amount,
      t.payment_method ?? "",
    ]);
    const tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
    downloadBlob(new Blob([tsv], { type: "application/vnd.ms-excel" }), "laporan-keuangan.xls");
  };

  const exportPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const rowsHtml = filtered.map((t) => {
      const cat = cats?.find((c) => c.id === t.category_id)?.name ?? "";
      const sign = t.type === "income" ? "+" : "−";
      const color = t.type === "income" ? "#111111" : "#666666";
      return `<tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.type === "income" ? "Pemasukan" : "Pengeluaran"}</td>
        <td>${cat}</td>
        <td>${t.product ?? ""}</td>
        <td>${t.description ?? ""}</td>
        <td style="text-align:right;color:${color};font-weight:600">${sign} ${formatRupiah(t.amount)}</td>
      </tr>`;
    }).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Laporan Keuangan</title>
      <style>body{font-family:system-ui;padding:24px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}th{background:#f3f4f6}.summary{display:flex;gap:12px;margin-top:12px}.card{flex:1;padding:12px;border:1px solid #eee;border-radius:8px}</style></head>
      <body><h1>Laporan Keuangan</h1><div style="color:#666;font-size:13px">Periode: ${labelFor(period, month, year)}</div>
      <div class="summary">
        <div class="card"><div style="font-size:11px;color:#666">Pemasukan</div><div style="font-size:18px;font-weight:700;color:#111111">${formatRupiah(totals.income)}</div></div>
        <div class="card"><div style="font-size:11px;color:#666">Pengeluaran</div><div style="font-size:18px;font-weight:700;color:#666666">${formatRupiah(totals.expense)}</div></div>
        <div class="card"><div style="font-size:11px;color:#666">Saldo</div><div style="font-size:18px;font-weight:700">${formatRupiah(totals.balance)}</div></div>
      </div>
      <table><thead><tr><th>Tanggal</th><th>Tipe</th><th>Kategori</th><th>Produk</th><th>Deskripsi</th><th style="text-align:right">Jumlah</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const years = useMemo(() => {
    const s = new Set<number>([now.getFullYear()]);
    (txs ?? []).forEach((t) => s.add(new Date(t.date).getFullYear()));
    return Array.from(s).sort((a, b) => b - a);
  }, [txs, now]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Laporan</h1>
          <p className="text-sm text-muted-foreground">{labelFor(period, month, year)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Cetak</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportPdf}><FileText className="h-4 w-4" /> PDF</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
              <SelectItem value="yearly">Tahunan</SelectItem>
            </SelectContent>
          </Select>
          {period === "monthly" && (
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthNames.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {(period === "monthly" || period === "yearly") && (
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Pemasukan" value={totals.income} tone="income" />
        <SummaryCard label="Total Pengeluaran" value={totals.expense} tone="expense" />
        <SummaryCard label="Saldo Bersih" value={totals.balance} tone={totals.balance >= 0 ? "income" : "expense"} />
      </div>

      <Card>
        <CardHeader><CardTitle>Detail Transaksi</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada data pada periode ini</TableCell></TableRow>
                ) : filtered.map((t) => {
                  const cat = cats?.find((c) => c.id === t.category_id)?.name ?? "—";
                  const isIncome = t.type === "income";
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "border px-2.5 py-0.5 text-xs font-bold rounded-xl",
                          isIncome ? "bg-foreground text-background border-foreground"
                            : "bg-accent/60 text-foreground/70 border-border/80")}>
                          {isIncome ? "Masuk" : "Keluar"}
                        </Badge>
                      </TableCell>
                      <TableCell>{cat}</TableCell>
                      <TableCell>{t.product ?? "—"}</TableCell>
                      <TableCell className={cn("text-right font-extrabold whitespace-nowrap tabular-nums",
                        isIncome ? "text-foreground" : "text-muted-foreground")}>
                        {isIncome ? "+" : "−"} {formatRupiah(t.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "income" | "expense" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("mt-2 text-2xl font-black tracking-tight",
          tone === "income" ? "text-foreground" : "text-foreground/80")}>
          {formatRupiah(value)}
        </p>
      </CardContent>
    </Card>
  );
}

function labelFor(p: Period, m: number, y: number) {
  if (p === "daily") return "Hari ini";
  if (p === "weekly") return "7 hari terakhir";
  if (p === "monthly") return `${monthNames[m]} ${y}`;
  return `Tahun ${y}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
