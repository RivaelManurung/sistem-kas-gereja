import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, Calculator, Calendar, CheckCircle2, Clock, FileCheck, Receipt, Wallet, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dasbor',
        href: '/dashboard',
    },
];

interface FundBalance {
    id: number;
    code: string;
    name: string;
    balance: number;
}

interface AccountBalance {
    id: number;
    code: string;
    name: string;
    type: string;
    bank_name?: string | null;
    balance: number;
}

interface MonthlyTrendItem {
    month: string;
    label: string;
    income: number;
    expense: number;
    net: number;
}

interface WaitingConfirmationCountSheet {
    id: number;
    date: string;
    type: string;
    type_label: string;
    total_amount: number;
    session_name: string;
    confirmations_count: number;
    required_confirmations: number;
}

interface WaitingVerificationCountSheet {
    id: number;
    date: string;
    type: string;
    type_label: string;
    total_amount: number;
    session_name: string;
}

interface WaitingApprovalExpense {
    id: number;
    expense_number: string;
    payee: string;
    amount: number;
    date: string;
    fund_name?: string | null;
    category_name?: string | null;
    description?: string | null;
    is_above_threshold: boolean;
    submitter_name?: string | null;
}

interface UncountedSession {
    id: number;
    name: string;
    date: string;
}

interface DashboardProps {
    fundBalances?: FundBalance[];
    accountBalances?: AccountBalance[];
    monthlyTrend?: MonthlyTrendItem[];
    summary?: {
        totalBalance: number;
        thisMonthIncome: number;
        thisMonthExpense: number;
    };
    alerts?: {
        waitingConfirmationCountSheets: WaitingConfirmationCountSheet[];
        waitingVerificationCountSheets: WaitingVerificationCountSheet[];
        waitingApprovalExpenses: WaitingApprovalExpense[];
        uncountedSessions: UncountedSession[];
    };
}

/** 1.250.000 -> "1,3 jt", dipakai untuk label sumbu grafik. */
function compactRupiah(n: number) {
    const abs = Math.abs(n);
    if (abs >= 1e9) return `${(n / 1e9).toFixed(1).replace('.', ',')} M`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')} jt`;
    if (abs >= 1e3) return `${Math.round(n / 1e3)} rb`;
    return String(n);
}

interface TaskRow {
    key: string;
    icon: LucideIcon;
    tone: 'warning' | 'info' | 'expense' | 'muted';
    title: string;
    meta: string;
    amount?: number;
    badge?: string;
    href: string;
    action: string;
}

const TONE: Record<TaskRow['tone'], string> = {
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    expense: 'bg-expense/10 text-expense',
    muted: 'bg-muted text-muted-foreground',
};

function Stat({ label, value, hint, tone, icon: Icon }: { label: string; value: number; hint: string; tone?: 'income' | 'expense'; icon: LucideIcon }) {
    return (
        <div className="flex flex-1 items-start gap-4 p-5 md:p-6">
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tone === 'income' ? 'bg-income/10 text-income' : tone === 'expense' ? 'bg-expense/10 text-expense' : 'bg-primary/10 text-primary')}>
                <Icon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
                <p className="text-muted-foreground text-sm">{label}</p>
                <p className={cn('mt-1 truncate text-2xl font-semibold tracking-tight tabular-nums', tone === 'income' && 'text-income', tone === 'expense' && 'text-expense')}>
                    {formatRupiah(value)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
            </div>
        </div>
    );
}

export default function Dashboard({
    fundBalances = [],
    accountBalances = [],
    monthlyTrend = [],
    summary = { totalBalance: 0, thisMonthIncome: 0, thisMonthExpense: 0 },
    alerts = {
        waitingConfirmationCountSheets: [],
        waitingVerificationCountSheets: [],
        waitingApprovalExpenses: [],
        uncountedSessions: [],
    },
}: DashboardProps) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const tasks: TaskRow[] = [
        ...alerts.waitingConfirmationCountSheets.map((s): TaskRow => ({
            key: `c${s.id}`,
            icon: Clock,
            tone: 'warning',
            title: s.session_name,
            meta: `Menunggu saksi, ${s.confirmations_count} dari ${s.required_confirmations} konfirmasi · ${formatDate(s.date)}`,
            amount: s.total_amount,
            href: `/counting/${s.id}`,
            action: 'Konfirmasi',
        })),
        ...alerts.waitingVerificationCountSheets.map((s): TaskRow => ({
            key: `v${s.id}`,
            icon: FileCheck,
            tone: 'info',
            title: s.session_name,
            meta: `Menunggu verifikasi bendahara · ${formatDate(s.date)}`,
            amount: s.total_amount,
            href: `/counting/${s.id}`,
            action: 'Verifikasi',
        })),
        ...alerts.waitingApprovalExpenses.map((e): TaskRow => ({
            key: `e${e.id}`,
            icon: Receipt,
            tone: 'expense',
            title: `${e.payee} · ${e.expense_number}`,
            meta: `${[e.fund_name, e.category_name].filter(Boolean).join(' · ')} · ${formatDate(e.date)}`,
            amount: e.amount,
            badge: e.is_above_threshold ? 'Butuh Majelis' : undefined,
            href: `/expenses/${e.id}`,
            action: 'Periksa',
        })),
        ...alerts.uncountedSessions.map((s): TaskRow => ({
            key: `s${s.id}`,
            icon: Calendar,
            tone: 'muted',
            title: s.name,
            meta: `Belum ada berita acara · ${formatDate(s.date)}`,
            href: `/counting/create?session_id=${s.id}`,
            action: 'Buat hitungan',
        })),
    ];

    const hasTrendData = monthlyTrend.some((m) => m.income > 0 || m.expense > 0);
    const maxMonthly = Math.max(...monthlyTrend.map((m) => Math.max(m.income, m.expense)), 1);
    const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(maxMonthly * f));
    const totalFund = fundBalances.reduce((sum, f) => sum + Math.max(f.balance, 0), 0);
    const totalAccount = accountBalances.reduce((sum, a) => sum + Math.max(a.balance, 0), 0);
    const monthNet = summary.thisMonthIncome - summary.thisMonthExpense;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dasbor Keuangan" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Dasbor Keuangan</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Posisi kas gereja, arus bulanan, dan pekerjaan yang menunggu Anda.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild>
                            <Link href="/counting/create">
                                <Calculator className="size-4" />
                                Hitung kolekte
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/expenses/create">
                                <Receipt className="size-4" />
                                Ajukan pengeluaran
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Posisi kas: satu kartu, tiga angka utama */}
                <Card>
                    <div className="divide-border flex flex-col divide-y md:flex-row md:divide-x md:divide-y-0">
                        <Stat label="Total saldo kas dan bank" value={summary.totalBalance} hint="Gabungan seluruh rekening dan pos dana aktif" icon={Wallet} />
                        <Stat label="Pemasukan bulan ini" value={summary.thisMonthIncome} hint="Penerimaan yang sudah dibukukan" tone="income" icon={ArrowUpRight} />
                        <Stat label="Pengeluaran bulan ini" value={summary.thisMonthExpense} hint={`Selisih bulan ini ${monthNet >= 0 ? '+' : '-'}${formatRupiah(Math.abs(monthNet))}`} tone="expense" icon={ArrowDownRight} />
                    </div>
                </Card>

                <div className="grid items-start gap-6 xl:grid-cols-3">
                    {/* Grafik arus kas */}
                    <Card className="xl:col-span-2">
                        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                            <div className="space-y-1">
                                <CardTitle>Arus kas 6 bulan terakhir</CardTitle>
                                <CardDescription>Pemasukan dibandingkan pengeluaran per bulan.</CardDescription>
                            </div>
                            <div className="flex shrink-0 items-center gap-4 text-xs">
                                <span className="flex items-center gap-1.5">
                                    <span className="bg-income size-2.5 rounded-sm" />
                                    Pemasukan
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="bg-expense size-2.5 rounded-sm" />
                                    Pengeluaran
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {hasTrendData ? (
                                <div role="img" aria-label="Grafik batang pemasukan dan pengeluaran per bulan" className="flex gap-3">
                                    <div className="text-muted-foreground flex h-56 flex-col justify-between pb-0 text-right text-[11px] tabular-nums">
                                        {ticks.map((t, i) => (
                                            <span key={i} className="leading-none">
                                                {compactRupiah(t)}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative flex-1">
                                        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-56 flex-col justify-between">
                                            {ticks.map((_, i) => (
                                                <div key={i} className="border-border/70 border-t border-dashed first:border-solid" />
                                            ))}
                                        </div>
                                        <div className="relative flex h-56 items-end justify-around gap-2">
                                            {monthlyTrend.map((m) => (
                                                <div key={m.month} className="flex h-full flex-1 items-end justify-center gap-1.5" title={`${m.label}: masuk ${formatRupiah(m.income)}, keluar ${formatRupiah(m.expense)}`}>
                                                    {[
                                                        { v: m.income, c: 'bg-income' },
                                                        { v: m.expense, c: 'bg-expense' },
                                                    ].map((bar, i) => (
                                                        <div
                                                            key={i}
                                                            className={cn('w-full max-w-9 origin-bottom rounded-t-md transition-transform duration-700 ease-out motion-reduce:transition-none', bar.c, ready ? 'scale-y-100' : 'scale-y-0')}
                                                            style={{ height: `${Math.max((bar.v / maxMonthly) * 100, bar.v > 0 ? 1.5 : 0)}%`, transitionDelay: `${i * 60}ms` }}
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-muted-foreground mt-2 flex justify-around gap-2 text-xs">
                                            {monthlyTrend.map((m) => (
                                                <span key={m.month} className="flex-1 text-center">
                                                    {m.label.split(' ')[0]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-12 text-center">
                                    <p className="text-sm font-medium">Belum ada transaksi yang dibukukan</p>
                                    <p className="text-muted-foreground max-w-sm text-sm">Grafik muncul setelah berita acara hitung diverifikasi dan dikunci, atau pengeluaran dibayar.</p>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href="/counting/create">Mulai hitung kolekte</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                        {hasTrendData && (
                            <div className="border-t">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bulan</TableHead>
                                            <TableHead className="text-right">Pemasukan</TableHead>
                                            <TableHead className="text-right">Pengeluaran</TableHead>
                                            <TableHead className="text-right">Selisih</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {monthlyTrend.map((m) => (
                                            <TableRow key={m.month}>
                                                <TableCell className="font-medium">{m.label}</TableCell>
                                                <TableCell className="text-income text-right tabular-nums">{formatRupiah(m.income)}</TableCell>
                                                <TableCell className="text-expense text-right tabular-nums">{formatRupiah(m.expense)}</TableCell>
                                                <TableCell className={cn('text-right font-semibold tabular-nums', m.net < 0 && 'text-expense')}>{formatRupiah(m.net)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>

                    {/* Pekerjaan yang menunggu */}
                    <Card>
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                            <CardTitle>Perlu tindakan</CardTitle>
                            {tasks.length > 0 && <Badge variant="secondary">{tasks.length}</Badge>}
                        </CardHeader>
                        <CardContent className="px-0 md:px-0">
                            {tasks.length > 0 ? (
                                <ul className="divide-border divide-y">
                                    {tasks.map((t) => {
                                        const Icon = t.icon;
                                        return (
                                            <li key={t.key} className="flex items-start gap-3 px-5 py-3.5 md:px-6">
                                                <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', TONE[t.tone])}>
                                                    <Icon className="size-4" aria-hidden="true" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                                                        <span className="truncate">{t.title}</span>
                                                        {t.badge && <Badge className="border-expense/30 bg-expense/10 text-expense px-1.5 py-0 text-[10px]">{t.badge}</Badge>}
                                                    </p>
                                                    <p className="text-muted-foreground mt-0.5 text-xs">{t.meta}</p>
                                                    {t.amount !== undefined && <p className="mt-1 text-sm font-semibold tabular-nums">{formatRupiah(t.amount)}</p>}
                                                </div>
                                                <Button asChild size="sm" variant="outline" className="shrink-0">
                                                    <Link href={t.href}>{t.action}</Link>
                                                </Button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                                    <span className="bg-income/10 text-income flex size-10 items-center justify-center rounded-full">
                                        <CheckCircle2 className="size-5" aria-hidden="true" />
                                    </span>
                                    <p className="text-sm font-medium">Semua pekerjaan sudah beres</p>
                                    <p className="text-muted-foreground text-xs">Tidak ada berita acara atau pengeluaran yang menunggu tindakan.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-2">
                    <BalanceCard
                        title="Saldo per pos dana"
                        description="Pembagian saldo kas ke pos tujuan dan program."
                        manageHref="/admin/funds"
                        manageLabel="Kelola pos dana"
                        empty="Belum ada pos dana aktif."
                        total={totalFund}
                        rows={fundBalances.map((f) => ({ key: f.id, name: f.name, sub: f.code, balance: f.balance }))}
                    />
                    <BalanceCard
                        title="Saldo per rekening"
                        description="Uang yang benar-benar ada di kas tunai dan bank."
                        manageHref="/admin/accounts"
                        manageLabel="Kelola rekening"
                        empty="Belum ada rekening aktif."
                        total={totalAccount}
                        rows={accountBalances.map((a) => ({
                            key: a.id,
                            name: a.name,
                            sub: [a.code, a.bank_name].filter(Boolean).join(' · '),
                            tag: a.type === 'bank' ? 'Bank' : 'Tunai',
                            balance: a.balance,
                        }))}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

interface BalanceRow {
    key: number;
    name: string;
    sub?: string;
    tag?: string;
    balance: number;
}

function BalanceCard({ title, description, manageHref, manageLabel, empty, total, rows }: { title: string; description: string; manageHref: string; manageLabel: string; empty: string; total: number; rows: BalanceRow[] }) {
    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <Link href={manageHref} className="text-primary shrink-0 text-sm font-medium hover:underline">
                    {manageLabel}
                </Link>
            </CardHeader>
            <CardContent className="px-0 md:px-0">
                {rows.length > 0 ? (
                    <ul className="divide-border divide-y">
                        {rows.map((r) => {
                            const share = total > 0 ? Math.max(r.balance, 0) / total : 0;
                            return (
                                <li key={r.key} className="px-5 py-3 md:px-6">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-2 text-sm font-medium">
                                                <span className="truncate">{r.name}</span>
                                                {r.tag && <Badge variant="outline" className="text-[10px] font-medium">{r.tag}</Badge>}
                                            </p>
                                            {r.sub && <p className="text-muted-foreground text-xs">{r.sub}</p>}
                                        </div>
                                        <p className={cn('shrink-0 text-sm font-semibold tabular-nums', r.balance < 0 && 'text-expense')}>{formatRupiah(r.balance)}</p>
                                    </div>
                                    <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
                                        <div className="bg-primary/70 h-full rounded-full" style={{ width: `${Math.round(share * 100)}%` }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-muted-foreground px-6 py-8 text-center text-sm">{empty}</p>
                )}
            </CardContent>
        </Card>
    );
}
