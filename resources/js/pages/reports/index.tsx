import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileSignature,
    FileSpreadsheet,
    FileText,
    Newspaper,
    PlusCircle,
    ShieldCheck,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';

interface ReportRow {
    id: number;
    title: string;
    period_type: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
    verification_code: string;
    sha256_hash?: string | null;
    frozen_at?: string | null;
    creator?: { id: number; name: string };
    approvals?: Array<{ id: number; status: string }>;
}

interface FinancialData {
    period: { start_date: string; end_date: string; formatted: string };
    opening_balances: {
        by_fund: Array<{ fund_id: number; fund_code: string; fund_name: string; balance: number }>;
        by_account: Array<{ account_id: number; account_code: string; account_name: string; account_type: string; balance: number }>;
        total: number;
    };
    incomes: {
        by_category: Array<{ category_id: number | null; category_name: string; total: number; by_fund: Array<{ fund_id: number; fund_name: string; amount: number }> }>;
        total: number;
    };
    expenses: {
        by_category: Array<{ category_id: number | null; category_name: string; total: number; by_fund: Array<{ fund_id: number; fund_name: string; amount: number }> }>;
        total: number;
    };
    transfers: {
        by_fund: Array<{ fund_id: number; fund_name: string; in_amount: number; out_amount: number; net_transfer: number }>;
    };
    closing_balances: {
        by_fund: Array<{ fund_id: number; fund_code: string; fund_name: string; opening_balance: number; income: number; expense: number; net_transfer: number; closing_balance: number }>;
        by_account: Array<{ account_id: number; account_code: string; account_name: string; account_type: string; opening_balance: number; in_amount: number; out_amount: number; closing_balance: number }>;
        total: number;
    };
    summary: {
        total_opening: number;
        total_income: number;
        total_expense: number;
        net_change: number;
        total_closing: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Laporan Keuangan', href: '/reports' }];

export default function ReportsIndex({
    period,
    live_data,
    reports,
    can_initiate,
    has_signature,
}: {
    period: { period_type: string; start_date: string; end_date: string; label: string };
    live_data: FinancialData;
    reports: Paginated<ReportRow>;
    can_initiate: boolean;
    has_signature: boolean;
}) {
    const [periodType, setPeriodType] = useState(period.period_type || 'bulanan');
    const [fromDate, setFromDate] = useState(period.start_date);
    const [toDate, setToDate] = useState(period.end_date);
    const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
    const [reportTitle, setReportTitle] = useState(period.label);

    const handleApplyFilter = () => {
        router.get(
            route('reports.index'),
            {
                period_type: periodType,
                from: fromDate,
                to: toDate,
            },
            { preserveState: true }
        );
    };

    const handleInitiateReport = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            route('reports.store'),
            {
                title: reportTitle,
                period_type: periodType,
                start_date: period.start_date,
                end_date: period.end_date,
            },
            {
                onSuccess: () => setInitiateDialogOpen(false),
            }
        );
    };

    const getReportStatusBadge = (status: ReportRow['status']) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-emerald-600 text-white">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Disahkan &amp; Dibekukan
                    </Badge>
                );
            case 'pending_approval':
                return (
                    <Badge className="bg-amber-500 text-white">
                        <Clock className="mr-1 h-3 w-3" />
                        Menunggu Pengesahan
                    </Badge>
                );
            case 'rejected':
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">Draf</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Keuangan & Pengesahan" />

            <div className="space-y-6 p-4">
                <PageHeader
                    title="Laporan Keuangan & Pengesahan"
                    description="Perhitungan saldo, penerimaan, pengeluaran kas, mutasi dana berkala, dan pengesahan resmi bertanda tangan."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href={route('reports.bulletin')}>
                                    <Newspaper className="mr-2 h-4 w-4" />
                                    Warta Jemaat Mingguan
                                </Link>
                            </Button>

                            {can_initiate && (
                                <Dialog open={initiateDialogOpen} onOpenChange={setInitiateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                            <FileSignature className="mr-2 h-4 w-4" />
                                            Ajukan Pengesahan
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleInitiateReport}>
                                            <DialogHeader>
                                                <DialogTitle>Ajukan Pengesahan Laporan Resmi</DialogTitle>
                                                <DialogDescription>
                                                    Laporan untuk rentang tanggal terpilih akan dibentuk menjadi berkas pengesahan
                                                    resmi dengan alur tanda tangan multi-penandatangan.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Judul Laporan</Label>
                                                    <Input
                                                        id="title"
                                                        value={reportTitle}
                                                        onChange={(e) => setReportTitle(e.target.value)}
                                                        required
                                                    />
                                                </div>

                                                <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-900 border">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Periode Terpilih:</span>
                                                        <span className="font-semibold">{period.start_date} s/d {period.end_date}</span>
                                                    </div>
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-muted-foreground">Posisi Saldo Kas Akhir:</span>
                                                        <span className="font-bold tabular-nums text-emerald-600">
                                                            {formatRupiah(live_data.summary.total_closing)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setInitiateDialogOpen(false)}>
                                                    Batal
                                                </Button>
                                                <Button type="submit">Mulai Alur Pengesahan</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    }
                />

                {/* Filter Bar */}
                <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-40 space-y-1">
                            <Label className="text-xs">Jenis Periode</Label>
                            <Select value={periodType} onValueChange={setPeriodType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="harian">Harian</SelectItem>
                                    <SelectItem value="mingguan">Mingguan</SelectItem>
                                    <SelectItem value="bulanan">Bulanan</SelectItem>
                                    <SelectItem value="triwulan">Triwulan (3 Bulan)</SelectItem>
                                    <SelectItem value="semester">Semester (6 Bulan)</SelectItem>
                                    <SelectItem value="tahunan">Tahunan</SelectItem>
                                    <SelectItem value="custom">Rentang Bebas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-36 space-y-1">
                            <Label className="text-xs">Dari Tanggal</Label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        <div className="w-36 space-y-1">
                            <Label className="text-xs">Sampai Tanggal</Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>

                        <Button onClick={handleApplyFilter} variant="secondary">
                            Terapkan Periode
                        </Button>
                    </div>
                </Card>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs">Saldo Awal</CardDescription>
                            <CardTitle className="text-lg font-bold tabular-nums">
                                {formatRupiah(live_data.summary.total_opening)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs flex items-center text-emerald-600 font-medium">
                                <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> Total Penerimaan
                            </CardDescription>
                            <CardTitle className="text-lg font-bold tabular-nums text-emerald-600">
                                {formatRupiah(live_data.summary.total_income)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs flex items-center text-rose-600 font-medium">
                                <ArrowDownRight className="mr-1 h-3.5 w-3.5" /> Total Pengeluaran
                            </CardDescription>
                            <CardTitle className="text-lg font-bold tabular-nums text-rose-600">
                                {formatRupiah(live_data.summary.total_expense)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs">Surplus / Defisit</CardDescription>
                            <CardTitle
                                className={`text-lg font-bold tabular-nums ${
                                    live_data.summary.net_change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                            >
                                {live_data.summary.net_change >= 0 ? '+' : ''}
                                {formatRupiah(live_data.summary.net_change)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                                Saldo Kas Akhir
                            </CardDescription>
                            <CardTitle className="text-lg font-black tabular-nums text-blue-900 dark:text-blue-100">
                                {formatRupiah(live_data.summary.total_closing)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Tabbed Breakdowns */}
                <Card className="bg-white dark:bg-slate-900">
                    <Tabs defaultValue="incomes" className="p-4">
                        <TabsList className="mb-4">
                            <TabsTrigger value="incomes">Pemasukan ({live_data.incomes.by_category.length})</TabsTrigger>
                            <TabsTrigger value="expenses">Pengeluaran ({live_data.expenses.by_category.length})</TabsTrigger>
                            <TabsTrigger value="funds">Pos Dana ({live_data.closing_balances.by_fund.length})</TabsTrigger>
                            <TabsTrigger value="accounts">Rekening Kas/Bank ({live_data.closing_balances.by_account.length})</TabsTrigger>
                        </TabsList>

                        {/* Incomes Tab */}
                        <TabsContent value="incomes">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">No</TableHead>
                                            <TableHead>Kategori Pemasukan</TableHead>
                                            <TableHead className="text-right">Total (Rupiah)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {live_data.incomes.by_category.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell className="font-medium">{item.category_name}</TableCell>
                                                <TableCell className="text-right tabular-nums font-semibold text-emerald-600">
                                                    {formatRupiah(item.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-50 font-bold dark:bg-slate-800">
                                            <TableCell colSpan={2}>TOTAL PENERIMAAN KAS</TableCell>
                                            <TableCell className="text-right tabular-nums text-emerald-600 font-bold">
                                                {formatRupiah(live_data.incomes.total)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* Expenses Tab */}
                        <TabsContent value="expenses">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">No</TableHead>
                                            <TableHead>Kategori Pengeluaran</TableHead>
                                            <TableHead className="text-right">Total (Rupiah)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {live_data.expenses.by_category.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell className="font-medium">{item.category_name}</TableCell>
                                                <TableCell className="text-right tabular-nums font-semibold text-rose-600">
                                                    {formatRupiah(item.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-50 font-bold dark:bg-slate-800">
                                            <TableCell colSpan={2}>TOTAL PENGELUARAN KAS</TableCell>
                                            <TableCell className="text-right tabular-nums text-rose-600 font-bold">
                                                {formatRupiah(live_data.expenses.total)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* Funds Tab */}
                        <TabsContent value="funds">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Pos Dana</TableHead>
                                            <TableHead className="text-right">Saldo Awal</TableHead>
                                            <TableHead className="text-right">Pemasukan</TableHead>
                                            <TableHead className="text-right">Pengeluaran</TableHead>
                                            <TableHead className="text-right">Pindah Dana</TableHead>
                                            <TableHead className="text-right">Saldo Akhir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {live_data.closing_balances.by_fund.map((fund) => (
                                            <TableRow key={fund.fund_id}>
                                                <TableCell className="font-mono text-xs">{fund.fund_code}</TableCell>
                                                <TableCell className="font-medium">{fund.fund_name}</TableCell>
                                                <TableCell className="text-right tabular-nums">{formatRupiah(fund.opening_balance)}</TableCell>
                                                <TableCell className="text-right tabular-nums text-emerald-600">+{formatRupiah(fund.income)}</TableCell>
                                                <TableCell className="text-right tabular-nums text-rose-600">-{formatRupiah(fund.expense)}</TableCell>
                                                <TableCell className="text-right tabular-nums">{formatRupiah(fund.net_transfer)}</TableCell>
                                                <TableCell className="text-right tabular-nums font-bold">{formatRupiah(fund.closing_balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* Accounts Tab */}
                        <TabsContent value="accounts">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Rekening</TableHead>
                                            <TableHead>Jenis</TableHead>
                                            <TableHead className="text-right">Saldo Awal</TableHead>
                                            <TableHead className="text-right">Penerimaan</TableHead>
                                            <TableHead className="text-right">Pengeluaran</TableHead>
                                            <TableHead className="text-right">Saldo Akhir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {live_data.closing_balances.by_account.map((acc) => (
                                            <TableRow key={acc.account_id}>
                                                <TableCell className="font-mono text-xs">{acc.account_code}</TableCell>
                                                <TableCell className="font-medium">{acc.account_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{acc.account_type}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">{formatRupiah(acc.opening_balance)}</TableCell>
                                                <TableCell className="text-right tabular-nums text-emerald-600">+{formatRupiah(acc.in_amount)}</TableCell>
                                                <TableCell className="text-right tabular-nums text-rose-600">-{formatRupiah(acc.out_amount)}</TableCell>
                                                <TableCell className="text-right tabular-nums font-bold">{formatRupiah(acc.closing_balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>

                {/* Frozen & Official Reports List */}
                <Card className="bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center">
                            <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
                            Daftar Laporan Resmi &amp; Pengesahan
                        </CardTitle>
                        <CardDescription>
                            Arsip dokumen keuangan yang telah disahkan dan dibekukan dengan verifikasi keabsahan SHA-256.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Judul Laporan</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Kode Verifikasi</TableHead>
                                        <TableHead>Diajukan Oleh</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Belum ada laporan resmi yang diajukan.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reports.data.map((rep) => (
                                            <TableRow key={rep.id}>
                                                <TableCell className="font-medium">{rep.title}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {rep.start_date} s/d {rep.end_date}
                                                </TableCell>
                                                <TableCell>{getReportStatusBadge(rep.status)}</TableCell>
                                                <TableCell className="font-mono text-xs">{rep.verification_code}</TableCell>
                                                <TableCell className="text-xs">{rep.creator?.name ?? '—'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={route('reports.show', rep.id)}>
                                                                <Eye className="mr-1 h-3.5 w-3.5" />
                                                                Detail
                                                            </Link>
                                                        </Button>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a href={route('reports.pdf', rep.id)} download>
                                                                <Download className="mr-1 h-3.5 w-3.5" />
                                                                PDF
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {reports.data.length > 0 && (
                            <div className="mt-4">
                                <Pagination links={reports.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
