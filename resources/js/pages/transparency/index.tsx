import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRupiah } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { Download, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CategorySum {
    id: number;
    name: string;
    amount: number;
}

interface FundSum {
    id: number;
    name: string;
    description: string | null;
    balance: number;
}

interface MonthlyTrendItem {
    month: string;
    label: string;
    income: number;
    expense: number;
    net: number;
}

interface TransparencyProps {
    churchName: string;
    church: { address: string | null; city: string | null; phone: string | null; email: string | null };
    year: number;
    period: string;
    periodLabel: string;
    years: number[];
    fundBalances: FundSum[];
    incomeByCategory: CategorySum[];
    expenseByCategory: CategorySum[];
    monthlyTrend: MonthlyTrendItem[];
    reports: Array<{ title: string; period: string; code: string }>;
    summary: { totalBalance: number; totalIncome: number; totalExpense: number };
}

function compactRupiah(n: number) {
    const abs = Math.abs(n);
    if (abs >= 1e9) return `${(n / 1e9).toFixed(1).replace('.', ',')} M`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(0)} jt`;
    if (abs >= 1e3) return `${Math.round(n / 1e3)} rb`;
    return String(n);
}

function Breakdown({ title, description, rows, tone }: { title: string; description: string; rows: CategorySum[]; tone: 'income' | 'expense' }) {
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    const visible = rows.filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {visible.length > 0 ? (
                    <ul className="space-y-4">
                        {visible.map((row) => {
                            const share = total > 0 ? (row.amount / total) * 100 : 0;
                            return (
                                <li key={row.id}>
                                    <div className="flex items-baseline justify-between gap-4 text-sm">
                                        <span className="font-medium">{row.name}</span>
                                        <span className="tabular-nums">{formatRupiah(row.amount)}</span>
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-3">
                                        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden="true">
                                            <div className={cn('h-full rounded-full', tone === 'income' ? 'bg-income' : 'bg-expense')} style={{ width: `${share}%` }} />
                                        </div>
                                        <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{share.toFixed(0)}%</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-muted-foreground py-6 text-sm">Belum ada catatan pada periode ini.</p>
                )}
            </CardContent>
        </Card>
    );
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function Transparency({ churchName, church, year, period, periodLabel, years, fundBalances = [], incomeByCategory = [], expenseByCategory = [], monthlyTrend = [], reports = [], summary }: TransparencyProps) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const [loading, setLoading] = useState(false);
    const [pending, setPending] = useState<{ year: string; period: string } | null>(null);

    // Hanya data yang bergantung pada filter yang diminta ulang, dan pilihan langsung terlihat tanpa menunggu server.
    const go = (tahun: string, periode: string) => {
        setPending({ year: tahun, period: periode });
        router.get(
            '/transparansi',
            { tahun, periode: periode === 'all' ? undefined : periode },
            {
                only: ['year', 'period', 'periodLabel', 'summary', 'monthlyTrend', 'incomeByCategory', 'expenseByCategory', 'reports'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => {
                    setLoading(false);
                    setPending(null);
                },
            },
        );
    };
    const hasTrend = monthlyTrend.some((m) => m.income > 0 || m.expense > 0);
    const maxMonthly = Math.max(...monthlyTrend.map((m) => Math.max(m.income, m.expense)), 1);
    const ticks = [1, 0.5, 0].map((f) => Math.round(maxMonthly * f));
    const contact = [church.address, church.city].filter(Boolean).join(', ');

    return (
        <div className="bg-background text-foreground min-h-dvh">
            <Head title={`Laporan Keuangan Jemaat - ${periodLabel}`} />

            <header className="bg-[hsl(232,46%,18%)] text-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <BrandMark className="size-7" />
                        <span className="font-semibold tracking-tight">{churchName}</span>
                    </div>
                    <Link href="/login" className="text-sm text-white/70 transition-colors hover:text-white">
                        Masuk pengurus
                    </Link>
                </div>

                <div className="mx-auto max-w-6xl px-4 pt-4 pb-7 sm:px-6 sm:pt-6 sm:pb-9">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Laporan keuangan jemaat</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">
                        Ke mana persembahan kita pergi, dicatat dan dibuka untuk seluruh jemaat. &ldquo;Allah mengasihi orang yang memberi dengan sukacita.&rdquo; (2 Korintus 9:7)
                    </p>
                </div>
                <div className="bg-gold h-0.5" />
            </header>

            <div className="bg-card border-b">
                <form
                    className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:px-6"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <div className="w-full space-y-1.5 sm:w-32">
                        <Label htmlFor="filter-year">Tahun</Label>
                        <Select value={pending?.year ?? String(year)} onValueChange={(v) => go(v, 'all')}>
                            <SelectTrigger id="filter-year" className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={String(y)} className="tabular-nums">
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full space-y-1.5 sm:w-56">
                        <Label htmlFor="filter-period">Periode</Label>
                        <Select value={pending?.period ?? period} onValueChange={(v) => go(pending?.year ?? String(year), v)}>
                            <SelectTrigger id="filter-period" className="h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                <SelectItem value="all">Setahun penuh</SelectItem>
                                <SelectGroup>
                                    <SelectLabel>Semester</SelectLabel>
                                    <SelectItem value="s1">Semester 1 (Jan - Jun)</SelectItem>
                                    <SelectItem value="s2">Semester 2 (Jul - Des)</SelectItem>
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel>Triwulan</SelectLabel>
                                    {[1, 2, 3, 4].map((q) => (
                                        <SelectItem key={q} value={`q${q}`}>
                                            Triwulan {q}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel>Per bulan</SelectLabel>
                                    {MONTHS.map((m, i) => (
                                        <SelectItem key={m} value={`m${String(i + 1).padStart(2, '0')}`}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    {(period !== 'all' || year !== years[0]) && (
                        <Button type="button" variant="ghost" onClick={() => go(String(years[0]), 'all')}>
                            Atur ulang
                        </Button>
                    )}
                    <p className="text-muted-foreground flex items-center gap-2 text-sm sm:ml-auto sm:pb-2.5" role="status" aria-live="polite">
                        {loading ? (
                            <>
                                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                                Memuat data...
                            </>
                        ) : (
                            <>
                                Menampilkan <span className="text-foreground font-medium">{periodLabel}</span>
                            </>
                        )}
                    </p>
                </form>
            </div>

            <main aria-busy={loading} className={cn('mx-auto max-w-6xl space-y-6 px-4 py-8 transition-opacity duration-200 sm:px-6 sm:py-10', loading && 'pointer-events-none opacity-50')}>
                <Card>
                    <div className="divide-border flex flex-col divide-y md:flex-row md:divide-x md:divide-y-0">
                        {[
                            { label: 'Persembahan diterima', value: summary.totalIncome, tone: 'text-income', note: 'Dari seluruh kategori yang dibuka untuk jemaat' },
                            { label: 'Dipakai untuk pelayanan', value: summary.totalExpense, tone: 'text-expense', note: 'Operasional, pelayanan, dan diakonia' },
                            { label: 'Saldo kas saat ini', value: summary.totalBalance, tone: '', note: 'Seluruh pos dana, termasuk dana acara' },
                        ].map((item) => (
                            <div key={item.label} className="flex-1 p-6">
                                <p className="text-muted-foreground text-sm">{item.label}</p>
                                <p className={cn('mt-2 text-3xl font-semibold tracking-tight tabular-nums', item.tone)}>{formatRupiah(item.value)}</p>
                                <p className="text-muted-foreground mt-2 text-sm">{item.note}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                        <div className="space-y-1">
                            <CardTitle>Bulan demi bulan</CardTitle>
                            <CardDescription>Persembahan yang diterima dan dana yang dipakai setiap bulan pada periode ini.</CardDescription>
                        </div>
                        <div className="flex shrink-0 items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="bg-income size-2.5 rounded-sm" />
                                Diterima
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="bg-expense size-2.5 rounded-sm" />
                                Dipakai
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {hasTrend ? (
                            <div role="img" aria-label="Grafik batang persembahan diterima dan dana dipakai per bulan" className="flex gap-3">
                                <div className="text-muted-foreground flex h-48 flex-col justify-between text-right text-[11px] tabular-nums">
                                    {ticks.map((t, i) => (
                                        <span key={i} className="leading-none">
                                            {compactRupiah(t)}
                                        </span>
                                    ))}
                                </div>
                                <div className="relative min-w-0 flex-1">
                                    <div className="pointer-events-none absolute inset-x-0 top-0 flex h-48 flex-col justify-between">
                                        {ticks.map((_, i) => (
                                            <div key={i} className="border-border/70 border-t border-dashed first:border-solid" />
                                        ))}
                                    </div>
                                    <div className="relative flex h-48 items-end justify-around gap-1.5 sm:gap-3">
                                        {monthlyTrend.map((m) => (
                                            <div key={m.month} className="flex h-full flex-1 items-end justify-center gap-1" title={`${m.label}: diterima ${formatRupiah(m.income)}, dipakai ${formatRupiah(m.expense)}`}>
                                                {[
                                                    { v: m.income, c: 'bg-income' },
                                                    { v: m.expense, c: 'bg-expense' },
                                                ].map((bar, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn('w-full max-w-7 origin-bottom rounded-t-md transition-transform duration-700 ease-out motion-reduce:transition-none', bar.c, ready ? 'scale-y-100' : 'scale-y-0')}
                                                        style={{ height: `${Math.max((bar.v / maxMonthly) * 100, bar.v > 0 ? 1.5 : 0)}%`, transitionDelay: `${i * 60}ms` }}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-muted-foreground mt-2 flex justify-around gap-1.5 text-xs sm:gap-3">
                                        {monthlyTrend.map((m) => (
                                            <span key={m.month} className="flex-1 text-center">
                                                {m.label.split(' ')[0]}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground py-10 text-sm">Belum ada catatan persembahan pada periode ini.</p>
                        )}
                    </CardContent>
                </Card>

                <div className="grid items-start gap-6 lg:grid-cols-2">
                    <Breakdown title="Dari mana persembahan berasal" description="Jumlah per kategori, bukan per orang." rows={incomeByCategory} tone="income" />
                    <Breakdown title="Untuk apa persembahan dipakai" description="Jumlah per jenis pelayanan dan kebutuhan." rows={expenseByCategory} tone="expense" />
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle>Saldo per pos dana</CardTitle>
                        <CardDescription>Dana gereja dibagi ke beberapa pos sesuai tujuannya.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 md:p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pos dana</TableHead>
                                    <TableHead className="hidden md:table-cell">Untuk</TableHead>
                                    <TableHead className="text-right">Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fundBalances.map((fund) => (
                                    <TableRow key={fund.id}>
                                        <TableCell className="font-medium">{fund.name}</TableCell>
                                        <TableCell className="text-muted-foreground hidden md:table-cell">{fund.description ?? '-'}</TableCell>
                                        <TableCell className="text-right tabular-nums">{formatRupiah(fund.balance)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {reports.length > 0 && (
                    <Card>
                        <CardHeader className="space-y-1">
                            <CardTitle>Laporan resmi yang sudah disahkan</CardTitle>
                            <CardDescription>Ditandatangani bendahara, pemeriksa, dan majelis. Keasliannya bisa diperiksa dengan kode di setiap laporan.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 md:p-0">
                            <ul className="divide-border divide-y">
                                {reports.map((r) => (
                                    <li key={r.code} className="flex flex-col gap-2 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium sm:truncate">{r.title}</p>
                                            <p className="text-muted-foreground text-xs">{r.period}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-4 text-sm">
                                            <Link href={`/verify-report/${r.code}`} className="text-primary hover:underline">
                                                Periksa keaslian
                                            </Link>
                                            <a href={`/verify-report/${r.code}/download`} className="text-primary inline-flex items-center gap-1.5 hover:underline">
                                                <Download className="size-4" aria-hidden="true" />
                                                Unduh PDF
                                            </a>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </main>

            <footer className="border-t">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:px-6 md:flex-row md:justify-between">
                    <p className="text-muted-foreground max-w-xl leading-relaxed">
                        Halaman ini hanya menampilkan jumlah per kategori. Nama pemberi dan nominal pribadi tidak pernah ditampilkan.
                    </p>
                    <div className="text-muted-foreground md:text-right">
                        <p className="text-foreground font-medium">{churchName}</p>
                        {contact && <p>{contact}</p>}
                        {(church.phone || church.email) && <p>{[church.phone, church.email].filter(Boolean).join(' · ')}</p>}
                    </div>
                </div>
            </footer>
        </div>
    );
}
