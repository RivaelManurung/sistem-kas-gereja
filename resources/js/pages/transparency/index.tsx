import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRupiah } from '@/lib/money';
import { Head, Link } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, Building2, Lock, PiggyBank, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';

interface CategorySum {
    id: number;
    name: string;
    amount: number;
}

interface FundSum {
    id: number;
    code: string;
    name: string;
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
    fundBalances: FundSum[];
    incomeByCategory: CategorySum[];
    expenseByCategory: CategorySum[];
    monthlyTrend: MonthlyTrendItem[];
    summary: {
        totalBalance: number;
        totalIncome: number;
        totalExpense: number;
    };
}

export default function Transparency({
    churchName,
    fundBalances = [],
    incomeByCategory = [],
    expenseByCategory = [],
    monthlyTrend = [],
    summary = { totalBalance: 0, totalIncome: 0, totalExpense: 0 },
}: TransparencyProps) {
    const maxMonthlyAmount = Math.max(
        ...monthlyTrend.map((m) => Math.max(m.income, m.expense)),
        1
    );

    return (
        <div className="min-h-screen bg-muted/60 text-foreground selection:bg-primary/20 selection:text-primary">
            <Head title={`Transparansi Keuangan — ${churchName}`} />

            {/* Public Top Navigation */}
            <header className="sticky top-0 z-30 border-b border-border bg-card backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                            <Building2 className="size-5" />
                        </div>
                        <div>
                            <span className="font-semibold tracking-tight text-foreground">
                                {churchName}
                            </span>
                            <span className="ml-2 hidden rounded-full bg-income/10 px-2 py-0.5 text-[11px] font-medium text-income sm:inline">
                                Transparansi Terbuka
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <Link
                            href="/login"
                            className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Masuk Pengurus →
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero / Header Section */}
            <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
                <div className="space-y-3 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                        <ShieldCheck className="size-3.5 text-income" />
                        Laporan Transparansi Keuangan Publik
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Akuntabilitas & Transparansi Persembahan
                    </h1>
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Sebagai wujud pertanggungjawaban iman dan pengelolaan yang berintegritas, laporan keuangan gereja ini
                        disajikan secara terbuka dan agregat.
                    </p>

                    {/* Strict Privacy Guarantee Banner */}
                    <div className="flex items-center gap-2.5 rounded-lg border border-info/30 bg-info/10 p-3 text-xs text-info">
                        <Lock className="size-4 shrink-0 text-info" />
                        <span>
                            <strong>Komitmen Kerahasiaan:</strong> Demi melindungi privasi jemaat dan pihak ketiga, halaman publik ini
                            <strong> tidak pernah menampilkan identitas, nama donatur, pihak ketiga, maupun nominal transaksi perorangan</strong>. Seluruh data disajikan dalam bentuk akumulasi per kategori resmi.
                        </span>
                    </div>
                </div>

                {/* Big Headline Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-border bg-card shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Saldo Dana Kas Aktif
                            </CardTitle>
                            <div className="rounded-full bg-primary/10 p-2 text-primary">
                                <Wallet className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground sm:text-3xl">
                                {formatRupiah(summary.totalBalance)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Akumulasi saldo di seluruh pos pelayanan gereja
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Akumulasi Penerimaan Publik
                            </CardTitle>
                            <div className="rounded-full bg-income/10 p-2 text-income">
                                <ArrowUpRight className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight tabular-nums text-income sm:text-3xl">
                                {formatRupiah(summary.totalIncome)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Total persembahan terkumpul melalui pos terbuka
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Akumulasi Pengeluaran Publik
                            </CardTitle>
                            <div className="rounded-full bg-expense/10 p-2 text-expense">
                                <ArrowDownRight className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight tabular-nums text-expense sm:text-3xl">
                                {formatRupiah(summary.totalExpense)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Total realisasi biaya pelayanan & operasional
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Balances Breakdown: Pos Dana Pelayanan */}
                <Card className="border-border bg-card shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <PiggyBank className="size-4 text-primary" />
                            <CardTitle className="text-base font-semibold">Alokasi per Pos Dana Pelayanan</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            Penyaluran saldo kas gereja yang didistribusikan ke masing-masing bidang pelayanan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {fundBalances.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {fundBalances.map((fund) => (
                                    <div
                                        key={fund.id}
                                        className="rounded-lg border border-border bg-muted/60 p-3"
                                    >
                                        <div className="text-xs font-medium text-muted-foreground">{fund.code}</div>
                                        <div className="font-semibold text-foreground">{fund.name}</div>
                                        <div className="mt-2 text-lg font-bold tabular-nums text-foreground">
                                            {formatRupiah(fund.balance)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-muted-foreground">Tidak ada pos dana aktif.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Categories Breakdown: Pemasukan vs Pengeluaran */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Public Income by Category */}
                    <Card className="border-border bg-card shadow-xs">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight className="size-4 text-income" />
                                    <CardTitle className="text-base font-semibold">Penerimaan per Kategori</CardTitle>
                                </div>
                                <Badge variant="outline" className="text-xs font-normal">
                                    Total {formatRupiah(summary.totalIncome)}
                                </Badge>
                            </div>
                            <CardDescription className="text-xs">
                                Akumulasi persembahan dan donasi pada kategori yang dipublikasikan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {incomeByCategory.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {incomeByCategory.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between py-2.5 text-sm">
                                            <span className="font-medium text-foreground">{cat.name}</span>
                                            <span className="font-semibold tabular-nums text-income">
                                                {formatRupiah(cat.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-muted-foreground">Belum ada kategori penerimaan publik.</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Public Expense by Category */}
                    <Card className="border-border bg-card shadow-xs">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowDownRight className="size-4 text-expense" />
                                    <CardTitle className="text-base font-semibold">Pengeluaran per Kategori</CardTitle>
                                </div>
                                <Badge variant="outline" className="text-xs font-normal">
                                    Total {formatRupiah(summary.totalExpense)}
                                </Badge>
                            </div>
                            <CardDescription className="text-xs">
                                Realisasi pengeluaran kas yang disetujui pada pos operasional dan pelayanan publik.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {expenseByCategory.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {expenseByCategory.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between py-2.5 text-sm">
                                            <span className="font-medium text-foreground">{cat.name}</span>
                                            <span className="font-semibold tabular-nums text-expense">
                                                {formatRupiah(cat.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-muted-foreground">Belum ada kategori pengeluaran publik.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Trend Overview */}
                {monthlyTrend.length > 0 && (
                    <Card className="border-border bg-card shadow-xs">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="size-4 text-primary" />
                                    <CardTitle className="text-base font-semibold">Tren Arus Kas 6 Bulan Terakhir</CardTitle>
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-full bg-income" />
                                        <span className="text-muted-foreground">Pemasukan</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-full bg-expense" />
                                        <span className="text-muted-foreground">Pengeluaran</span>
                                    </div>
                                </div>
                            </div>
                            <CardDescription className="text-xs">
                                Riwayat agregat keuangan terbuka per bulan kalender.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 pt-2">
                                {monthlyTrend.map((item) => {
                                    const incomePct = Math.round((item.income / maxMonthlyAmount) * 100);
                                    const expensePct = Math.round((item.expense / maxMonthlyAmount) * 100);

                                    return (
                                        <div key={item.month} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-foreground">
                                                    {item.label}
                                                </span>
                                                <div className="flex items-center gap-3 tabular-nums">
                                                    <span className="text-income">
                                                        +{formatRupiah(item.income)}
                                                    </span>
                                                    <span className="text-expense">
                                                        -{formatRupiah(item.expense)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-muted/60">
                                                <div
                                                    className="h-full rounded-full bg-income"
                                                    style={{ width: `${Math.max(incomePct, item.income > 0 ? 2 : 0)}%` }}
                                                />
                                                <div
                                                    className="h-full rounded-full bg-expense"
                                                    style={{ width: `${Math.max(expensePct, item.expense > 0 ? 2 : 0)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer Notice */}
                <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
                    <p>
                        © {new Date().getFullYear()} {churchName} · Sistem Pengelolaan Kas & Persembahan Gereja
                    </p>
                    <p className="mt-1 text-[11px]">
                        Laporan ini diperbarui secara otomatis dari sistem pembukuan buku besar append-only gereja.
                    </p>
                </footer>
            </main>
        </div>
    );
}
