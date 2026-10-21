import PageHeader from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate, formatDateTime } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, Download, ExternalLink, FileCheck2, FileSignature, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface ApprovalRow {
    id: number;
    order: number;
    title: string;
    position: string;
    role?: string | null;
    user_id?: number | null;
    signer_name?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    approved_at?: string | null;
    notes?: string | null;
    has_signature: boolean;
}

interface ReportDetail {
    id: number;
    title: string;
    period_type: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
    is_frozen: boolean;
    frozen_at?: string | null;
    sha256_hash?: string | null;
    verification_code: string;
    data_snapshot: {
        opening_balances: { total: number };
        incomes: {
            total: number;
            by_category: Array<{ category_id: number | null; category_name: string; total: number }>;
        };
        expenses: {
            total: number;
            by_category: Array<{ category_id: number | null; category_name: string; total: number }>;
        };
        closing_balances: {
            total: number;
            by_fund: Array<{ fund_code: string; fund_name: string; closing_balance: number }>;
            by_account: Array<{ account_code: string; account_name: string; closing_balance: number }>;
        };
        summary: {
            total_opening: number;
            total_income: number;
            total_expense: number;
            total_closing: number;
        };
    };
    creator?: { id: number; name: string };
    approvals: ApprovalRow[];
}

export default function ReportsShow({
    report,
    user_pending_approval_id,
    has_user_signature,
    verification_url,
}: {
    report: ReportDetail;
    user_pending_approval_id?: number | null;
    has_user_signature: boolean;
    verification_url: string;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Laporan Keuangan', href: '/reports' },
        { title: report.title, href: `/reports/${report.id}` },
    ];

    const [signDialogOpen, setSignDialogOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user_pending_approval_id) return;

        setIsSubmitting(true);
        router.post(
            route('reports.approve', [report.id, user_pending_approval_id]),
            { notes },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setSignDialogOpen(false);
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Laporan: ${report.title}`} />

            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back="/reports"
                    title={report.title}
                    description={`Periode: ${formatDate(report.start_date)} s/d ${formatDate(report.end_date)} • Kode: ${report.verification_code}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="secondary" asChild>
                                <a href={route('reports.pdf', report.id)} download>
                                    <Download className="mr-2 h-4 w-4" />
                                    Unduh PDF Resmi
                                </a>
                            </Button>
                            {report.is_frozen && (
                                <Button variant="outline" asChild>
                                    <a href={verification_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Cek Verifikasi Publik
                                    </a>
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Status Banners */}
                {report.is_frozen ? (
                    <Alert className="border-income/30 bg-income/10 text-income">
                        <ShieldCheck className="h-5 w-5 text-income" />
                        <AlertTitle className="font-bold">Laporan Resmi Telah Dibekukan</AlertTitle>
                        <AlertDescription className="text-sm">
                            Dokumen ini telah disetujui oleh seluruh penanda tangan, stempel resmi gereja telah dibubuhkan, dan
                            data telah dibekukan secara permanen dengan checksum SHA-256:{' '}
                            <span className="font-mono text-xs select-all">{report.sha256_hash}</span>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="border-warning/30 bg-warning/10 text-warning">
                        <Clock className="h-5 w-5 text-warning" />
                        <AlertTitle className="font-bold">Menunggu Pengesahan Penanda Tangan</AlertTitle>
                        <AlertDescription className="text-sm">
                            Laporan ini sedang dalam alur pengesahan. Stempel resmi gereja akan otomatis diterapkan dan berkas
                            dibekukan setelah semua penanda tangan menandatangani.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Sign Action Banner for current user */}
                {user_pending_approval_id && (
                    <Card className="border-info/30 bg-info/10">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border-info/30 bg-info/10 text-info">
                                    <FileSignature className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-info">
                                        Tanda Tangan Anda Diperlukan
                                    </h4>
                                    <p className="text-xs text-info">
                                        Akun Anda berwenang menandatangani dokumen ini. Pastikan Anda telah memeriksa kebenaran angka laporan.
                                    </p>
                                </div>
                            </div>

                            {!has_user_signature ? (
                                <Button variant="destructive" size="sm" asChild>
                                    <Link href={route('settings.signature.edit')}>
                                        <AlertCircle className="mr-1.5 h-4 w-4" />
                                        Atur Tanda Tangan Terlebih Dahulu
                                    </Link>
                                </Button>
                            ) : (
                                <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <FileSignature className="mr-2 h-4 w-4" />
                                            Tandatangani Laporan Ini
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleSign}>
                                            <DialogHeader>
                                                <DialogTitle>Tandatangani &amp; Sahkan Laporan</DialogTitle>
                                                <DialogDescription>
                                                    Tanda tangan resmi yang tersimpan di akun Anda akan dibubuhkan pada dokumen ini
                                                    beserta catatan waktu persetujuan.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="notes">Catatan Pengesahan (Opsional)</Label>
                                                    <Textarea
                                                        id="notes"
                                                        placeholder="Tambahkan catatan atau persetujuan jika diperlukan..."
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setSignDialogOpen(false)}>
                                                    Batal
                                                </Button>
                                                <Button type="submit" disabled={isSubmitting}>
                                                    {isSubmitting ? 'Memproses...' : 'Bubuhkan Tanda Tangan'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Signatories & Approvals Progress */}
                <Card className="bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center">
                            <FileCheck2 className="mr-2 h-5 w-5 text-info" />
                            Status Pengesahan Penanda Tangan
                        </CardTitle>
                        <CardDescription>
                            Daftar pejabat gereja yang menandatangani laporan keuangan ini secara berurutan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {report.approvals.map((app) => (
                                <div
                                    key={app.id}
                                    className={`rounded-lg border p-4 transition-colors ${
                                        app.status === 'approved'
                                            ? 'bg-income/10 border-income/30'
                                            : 'bg-muted/60 border-border'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                                            {app.title}
                                        </span>
                                        {app.status === 'approved' ? (
                                            <Badge className="border-income/30 bg-income/10 text-income text-[10px]">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Disetujui
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px]">
                                                Menunggu
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="font-bold text-sm text-foreground">
                                        {app.position}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Nama: <span className="font-medium text-foreground">{app.signer_name ?? '—'}</span>
                                    </div>
                                    {app.approved_at && (
                                        <div className="text-[11px] text-income mt-2 flex items-center">
                                            <Clock className="mr-1 h-3 w-3" />
                                            {formatDateTime(app.approved_at)}
                                        </div>
                                    )}
                                    {app.notes && (
                                        <div className="text-xs italic text-muted-foreground mt-2 bg-card p-1.5 rounded">
                                            &ldquo;{app.notes}&rdquo;
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-card">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs">Saldo Awal</CardDescription>
                            <CardTitle className="text-base font-bold tabular-nums">
                                {formatRupiah(report.data_snapshot.summary.total_opening)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs text-income font-medium">Total Pemasukan</CardDescription>
                            <CardTitle className="text-base font-bold tabular-nums text-income">
                                +{formatRupiah(report.data_snapshot.summary.total_income)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-card">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs text-expense font-medium">Total Pengeluaran</CardDescription>
                            <CardTitle className="text-base font-bold tabular-nums text-expense">
                                -{formatRupiah(report.data_snapshot.summary.total_expense)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-info/10 border-info/30">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold text-info">
                                Saldo Kas Akhir
                            </CardDescription>
                            <CardTitle className="text-base font-black tabular-nums text-info">
                                {formatRupiah(report.data_snapshot.summary.total_closing)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Detailed Sections Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Incomes */}
                    <Card className="bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Rincian Pemasukan Kas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.data_snapshot.incomes.by_category.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{item.category_name}</TableCell>
                                            <TableCell className="text-right tabular-nums text-income font-medium">
                                                {formatRupiah(item.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold bg-muted/60">
                                        <TableCell>Total</TableCell>
                                        <TableCell className="text-right tabular-nums text-income">
                                            {formatRupiah(report.data_snapshot.incomes.total)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Expenses */}
                    <Card className="bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Rincian Pengeluaran Kas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.data_snapshot.expenses.by_category.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{item.category_name}</TableCell>
                                            <TableCell className="text-right tabular-nums text-expense font-medium">
                                                {formatRupiah(item.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold bg-muted/60">
                                        <TableCell>Total</TableCell>
                                        <TableCell className="text-right tabular-nums text-expense">
                                            {formatRupiah(report.data_snapshot.expenses.total)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
