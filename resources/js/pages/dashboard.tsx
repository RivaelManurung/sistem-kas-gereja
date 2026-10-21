import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Calculator,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    FileCheck,
    PiggyBank,
    Receipt,
    Wallet,
} from 'lucide-react';

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
    const totalAlertsCount =
        alerts.waitingConfirmationCountSheets.length +
        alerts.waitingVerificationCountSheets.length +
        alerts.waitingApprovalExpenses.length +
        alerts.uncountedSessions.length;

    // Calculate max amount for monthly trend chart normalization
    const maxMonthlyAmount = Math.max(
        ...monthlyTrend.map((m) => Math.max(m.income, m.expense)),
        1
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dasbor Keuangan" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Dasbor Keuangan
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Ringkasan saldo kas, tren bulanan, dan tugas operasional yang memerlukan tindakan.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/counting/create">
                            <Button size="sm" className="gap-1.5">
                                <Calculator className="size-4" />
                                Hitung Kolekte
                            </Button>
                        </Link>
                        <Link href="/expenses/create">
                            <Button size="sm" variant="outline" className="gap-1.5">
                                <Receipt className="size-4" />
                                Ajukan Pengeluaran
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                Total Saldo Kas & Bank
                            </CardTitle>
                            <div className="rounded-full bg-primary/10 p-2 text-primary">
                                <Wallet className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
                                {formatRupiah(summary.totalBalance)}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Akumulasi seluruh rekening kas & pos dana aktif
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                Pemasukan Bulan Ini
                            </CardTitle>
                            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                                {formatRupiah(summary.thisMonthIncome)}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Total penerimaan kas periode berjalan
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                Pengeluaran Bulan Ini
                            </CardTitle>
                            <div className="rounded-full bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                                <ArrowDownRight className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight tabular-nums text-rose-600 dark:text-rose-400">
                                {formatRupiah(summary.thisMonthExpense)}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Total pengeluaran kas yang telah dibayar
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Actionable Alerts Section */}
                {totalAlertsCount > 0 ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="size-5 text-amber-500" />
                            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Perhatian & Aksi yang Diperlukan ({totalAlertsCount})
                            </h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Alert: Waiting Confirmation */}
                            {alerts.waitingConfirmationCountSheets.length > 0 && (
                                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                                                <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                                                Menunggu Konfirmasi Penghitung ({alerts.waitingConfirmationCountSheets.length})
                                            </CardTitle>
                                            <Badge variant="outline" className="border-amber-300 text-amber-800 dark:text-amber-300">
                                                Draf
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs text-amber-800/80 dark:text-amber-300/80">
                                            Berita acara memerlukan tanda tangan saksi penghitung sebelum diverifikasi.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2.5">
                                        {alerts.waitingConfirmationCountSheets.map((sheet) => (
                                            <div
                                                key={sheet.id}
                                                className="flex items-center justify-between rounded-md border border-amber-200/80 bg-white p-2.5 text-xs shadow-xs dark:border-amber-900/50 dark:bg-neutral-900"
                                            >
                                                <div>
                                                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                        {sheet.session_name}
                                                    </div>
                                                    <div className="text-neutral-500">
                                                        {sheet.date} · {sheet.confirmations_count}/{sheet.required_confirmations} konfirmasi
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                                                        {formatRupiah(sheet.total_amount)}
                                                    </span>
                                                    <Link href={`/counting/${sheet.id}`}>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs">
                                                            Konfirmasi
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Alert: Waiting Verification */}
                            {alerts.waitingVerificationCountSheets.length > 0 && (
                                <Card className="border-sky-200 bg-sky-50/50 dark:border-sky-900/40 dark:bg-sky-950/20">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-sky-900 dark:text-sky-200">
                                                <FileCheck className="size-4 text-sky-600 dark:text-sky-400" />
                                                Menunggu Verifikasi Bendahara ({alerts.waitingVerificationCountSheets.length})
                                            </CardTitle>
                                            <Badge variant="outline" className="border-sky-300 text-sky-800 dark:text-sky-300">
                                                Terkonfirmasi
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs text-sky-800/80 dark:text-sky-300/80">
                                            Telah dikonfirmasi saksi, menunggu pemeriksaan dan penguncian bendahara.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2.5">
                                        {alerts.waitingVerificationCountSheets.map((sheet) => (
                                            <div
                                                key={sheet.id}
                                                className="flex items-center justify-between rounded-md border border-sky-200/80 bg-white p-2.5 text-xs shadow-xs dark:border-sky-900/50 dark:bg-neutral-900"
                                            >
                                                <div>
                                                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                        {sheet.session_name}
                                                    </div>
                                                    <div className="text-neutral-500">{sheet.date}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                                                        {formatRupiah(sheet.total_amount)}
                                                    </span>
                                                    <Link href={`/counting/${sheet.id}`}>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs">
                                                            Verifikasi
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Alert: Waiting Approval Expenses */}
                            {alerts.waitingApprovalExpenses.length > 0 && (
                                <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-rose-900 dark:text-rose-200">
                                                <Receipt className="size-4 text-rose-600 dark:text-rose-400" />
                                                Pengeluaran Menunggu Persetujuan ({alerts.waitingApprovalExpenses.length})
                                            </CardTitle>
                                            <Badge variant="outline" className="border-rose-300 text-rose-800 dark:text-rose-300">
                                                Persetujuan
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs text-rose-800/80 dark:text-rose-300/80">
                                            Pengajuan biaya operasional yang membutuhkan otorisasi pejabat berwenang.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2.5">
                                        {alerts.waitingApprovalExpenses.map((expense) => (
                                            <div
                                                key={expense.id}
                                                className="flex flex-col gap-2 rounded-md border border-rose-200/80 bg-white p-2.5 text-xs shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-rose-900/50 dark:bg-neutral-900"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                            {expense.expense_number} · {expense.payee}
                                                        </span>
                                                        {expense.is_above_threshold && (
                                                            <Badge className="bg-rose-600 px-1.5 py-0 text-[10px] text-white hover:bg-rose-700">
                                                                <AlertTriangle className="mr-0.5 inline size-2.5" />
                                                                Butuh Majelis
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-neutral-500">
                                                        {expense.fund_name} ({expense.category_name}) · {expense.date}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                                    <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                                                        {formatRupiah(expense.amount)}
                                                    </span>
                                                    <Link href={`/expenses/${expense.id}`}>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs">
                                                            Periksa
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Alert: Uncounted Service Sessions */}
                            {alerts.uncountedSessions.length > 0 && (
                                <Card className="border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/30">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                <Calendar className="size-4 text-neutral-600 dark:text-neutral-400" />
                                                Sesi Ibadah Belum Dihitung ({alerts.uncountedSessions.length})
                                            </CardTitle>
                                            <Badge variant="outline">Belum Dihitung</Badge>
                                        </div>
                                        <CardDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                            Ibadah yang sudah selesai atau sedang berjalan belum memiliki berita acara.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2.5">
                                        {alerts.uncountedSessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-2.5 text-xs shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
                                            >
                                                <div>
                                                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                        {session.name}
                                                    </div>
                                                    <div className="text-neutral-500">{session.date}</div>
                                                </div>
                                                <Link href={`/counting/create?session_id=${session.id}`}>
                                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                                        Buat Hitungan
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="text-sm">
                            <span className="font-semibold">Semua tugas operasional terkendali.</span> Tidak ada berita acara atau pengeluaran yang menunggu tindakan saat ini.
                        </div>
                    </div>
                )}

                {/* Balances Section: Funds & Accounts */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Pos Dana Balances */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PiggyBank className="size-4 text-primary" />
                                    <CardTitle className="text-base font-semibold">Saldo per Pos Dana</CardTitle>
                                </div>
                                <Link href="/admin/funds" className="text-xs text-primary hover:underline">
                                    Kelola Dana →
                                </Link>
                            </div>
                            <CardDescription className="text-xs">
                                Alokasi saldo kas gereja berdasarkan pos tujuan dan program.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {fundBalances.length > 0 ? (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {fundBalances.map((fund) => (
                                        <div key={fund.id} className="flex items-center justify-between py-2.5 text-sm">
                                            <div>
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {fund.name}
                                                </div>
                                                <div className="text-xs text-neutral-500">{fund.code}</div>
                                            </div>
                                            <div
                                                className={`font-semibold tabular-nums ${
                                                    fund.balance < 0
                                                        ? 'text-rose-600 dark:text-rose-400'
                                                        : 'text-neutral-900 dark:text-neutral-100'
                                                }`}
                                            >
                                                {formatRupiah(fund.balance)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-neutral-500">Belum ada pos dana aktif.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Rekening Kas & Bank Balances */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="size-4 text-primary" />
                                    <CardTitle className="text-base font-semibold">Saldo per Rekening Kas & Bank</CardTitle>
                                </div>
                                <Link href="/admin/accounts" className="text-xs text-primary hover:underline">
                                    Kelola Rekening →
                                </Link>
                            </div>
                            <CardDescription className="text-xs">
                                Saldo riil fisik di kas tunai dan rekening bank gereja.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {accountBalances.length > 0 ? (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {accountBalances.map((acc) => (
                                        <div key={acc.id} className="flex items-center justify-between py-2.5 text-sm">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                        {acc.name}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {acc.type === 'bank' ? 'Bank' : 'Tunai'}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-neutral-500">
                                                    {acc.code} {acc.bank_name ? `· ${acc.bank_name}` : ''}
                                                </div>
                                            </div>
                                            <div className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(acc.balance)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-neutral-500">Belum ada rekening aktif.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Trend Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign className="size-4 text-primary" />
                                <CardTitle className="text-base font-semibold">Tren Arus Kas Bulanan</CardTitle>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="size-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-neutral-600 dark:text-neutral-300">Pemasukan</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="size-2.5 rounded-full bg-rose-500" />
                                    <span className="text-neutral-600 dark:text-neutral-300">Pengeluaran</span>
                                </div>
                            </div>
                        </div>
                        <CardDescription className="text-xs">
                            Perbandingan penerimaan persembahan dan pengeluaran kas dalam 6 bulan terakhir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlyTrend.length > 0 ? (
                            <div className="space-y-4 pt-2">
                                {monthlyTrend.map((item) => {
                                    const incomePct = Math.round((item.income / maxMonthlyAmount) * 100);
                                    const expensePct = Math.round((item.expense / maxMonthlyAmount) * 100);

                                    return (
                                        <div key={item.month} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {item.label}
                                                </span>
                                                <div className="flex items-center gap-3 tabular-nums">
                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                        +{formatRupiah(item.income)}
                                                    </span>
                                                    <span className="text-rose-600 dark:text-rose-400">
                                                        -{formatRupiah(item.expense)}
                                                    </span>
                                                    <span
                                                        className={`font-semibold ${
                                                            item.net >= 0
                                                                ? 'text-neutral-900 dark:text-neutral-100'
                                                                : 'text-rose-600 dark:text-rose-400'
                                                        }`}
                                                    >
                                                        Net: {formatRupiah(item.net)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Visual Progress Comparison Bar */}
                                            <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                                    style={{ width: `${Math.max(incomePct, item.income > 0 ? 2 : 0)}%` }}
                                                    title={`Pemasukan: ${formatRupiah(item.income)}`}
                                                />
                                                <div
                                                    className="h-full rounded-full bg-rose-500 transition-all duration-300"
                                                    style={{ width: `${Math.max(expensePct, item.expense > 0 ? 2 : 0)}%` }}
                                                    title={`Pengeluaran: ${formatRupiah(item.expense)}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-neutral-500">Belum ada data transaksi buku besar.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
