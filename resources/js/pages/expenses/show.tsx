import PageHeader from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate, formatDateTime } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    FileText,
    Receipt,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ExpenseDetail {
    id: number;
    expense_number: string;
    payee: string;
    amount: number;
    date: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    description?: string | null;
    notes?: string | null;
    proof_path: string;
    submitted_by: number;
    approved_by?: number | null;
    approved_at?: string | null;
    paid_at?: string | null;
    created_at: string;
    account: { id: number; name: string };
    fund: { id: number; name: string };
    category: { id: number; name: string };
    submitter: { id: number; name: string };
    approver?: { id: number; name: string } | null;
}

export default function ExpensesShow({
    expense,
    fundBalance,
    setting,
    canApprove,
    canPay,
    needsMajelis,
}: {
    expense: ExpenseDetail;
    fundBalance: number;
    setting: { expense_approval_threshold: number; allow_negative_balance: boolean };
    canApprove: boolean;
    canPay: boolean;
    needsMajelis: boolean;
}) {
    const [rejectNotes, setRejectNotes] = useState('');
    const [showRejectBox, setShowRejectBox] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pengeluaran Kas', href: '/expenses' },
        { title: expense.expense_number, href: '#' },
    ];

    const isBalanceInsufficient = fundBalance < expense.amount && !setting.allow_negative_balance;

    const handleApprove = () => {
        if (confirm(`Setujui pengeluaran ${expense.expense_number} sebesar ${formatRupiah(expense.amount)}?`)) {
            router.post(route('expenses.approve', expense.id));
        }
    };

    const handleReject = () => {
        if (!rejectNotes.trim()) {
            alert('Mohon cantumkan alasan penolakan.');
            return;
        }
        router.post(route('expenses.reject', expense.id), { notes: rejectNotes });
    };

    const handlePay = () => {
        if (
            confirm(
                `Konfirmasi pembayaran pengeluaran ${expense.expense_number}? Ini akan langsung mencatat pengeluaran uang keluar di buku besar.`
            )
        ) {
            router.post(route('expenses.pay', expense.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pengeluaran ${expense.expense_number}`} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('expenses.index')}
                    title={`Pengeluaran: ${expense.expense_number}`}
                    description={`Diajukan pada ${formatDateTime(expense.created_at)} oleh ${expense.submitter.name}`}
                    actions={
                        <div className="flex items-center gap-2">
                            {canApprove && (
                                <>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowRejectBox(!showRejectBox)}
                                    >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Tolak
                                    </Button>
                                    <Button
                                        className="border-income/30 bg-income/10 text-income"
                                        onClick={handleApprove}
                                        disabled={isBalanceInsufficient}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Setujui Pengeluaran
                                    </Button>
                                </>
                            )}
                            {canPay && (
                                <Button
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                    onClick={handlePay}
                                    disabled={isBalanceInsufficient}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Bayar Sekarang & Bukukan ke Buku Besar
                                </Button>
                            )}
                        </div>
                    }
                />

                {isBalanceInsufficient && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Peringatan: Saldo Dana Tidak Mencukupi</AlertTitle>
                        <AlertDescription>
                            Saldo pos dana <strong>{expense.fund.name}</strong> saat ini adalah{' '}
                            <strong>{formatRupiah(fundBalance)}</strong>, sedangkan pengeluaran ini membutuhkan{' '}
                            <strong>{formatRupiah(expense.amount)}</strong>. Kebijakan gereja saat ini tidak mengizinkan saldo negatif.
                        </AlertDescription>
                    </Alert>
                )}

                {needsMajelis && expense.status === 'pending' && (
                    <Alert className="bg-warning/10 border-warning/30 text-warning">
                        <Clock className="h-4 w-4 text-warning" />
                        <AlertTitle>Memerlukan Persetujuan Majelis / Ketua</AlertTitle>
                        <AlertDescription>
                            Nominal pengeluaran ({formatRupiah(expense.amount)}) melebihi ambang batas kewenangan Bendahara{' '}
                            ({formatRupiah(setting.expense_approval_threshold)}), sehingga membutuhkan persetujuan dari Majelis atau Admin.
                        </AlertDescription>
                    </Alert>
                )}

                {showRejectBox && (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Alasan Penolakan Pengeluaran</CardTitle>
                            <CardDescription>
                                Berikan alasan mengapa pengajuan pengeluaran ini ditolak agar pengaju mengetahuinya.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Textarea
                                placeholder="Tulis alasan penolakan..."
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                rows={3}
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowRejectBox(false)}>
                                    Batal
                                </Button>
                                <Button variant="destructive" onClick={handleReject}>
                                    Konfirmasi Penolakan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 space-y-4">
                        <CardHeader>
                            <CardTitle>Rincian Keuangan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Nominal Pengeluaran</span>
                                    <span className="text-2xl font-bold text-expense tabular-nums">
                                        {formatRupiah(expense.amount)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Status Pengajuan</span>
                                    <div className="mt-1">
                                        {expense.status === 'pending' && (
                                            <Badge className="border-warning/30 bg-warning/10 text-warning">Menunggu Persetujuan</Badge>
                                        )}
                                        {expense.status === 'approved' && (
                                            <Badge className="border-info/30 bg-info/10 text-info">Disetujui (Menunggu Bayar)</Badge>
                                        )}
                                        {expense.status === 'paid' && (
                                            <Badge className="border-income/30 bg-income/10 text-income">Sudah Dibayar & Dibukukan</Badge>
                                        )}
                                        {expense.status === 'rejected' && (
                                            <Badge variant="destructive">Ditolak</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Penerima Uang (Payee)</span>
                                    <span className="font-semibold">{expense.payee}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Tanggal Transaksi</span>
                                    <span className="">{formatDate(expense.date)}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Kategori</span>
                                    <span>{expense.category.name}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Rekening Kas</span>
                                    <span>{expense.account.name}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Pos Dana Beban</span>
                                    <span className="font-semibold text-primary">{expense.fund.name}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Saldo Pos Dana Saat Ini</span>
                                    <span className="font-mono font-bold">
                                        {formatRupiah(fundBalance)}
                                    </span>
                                </div>
                            </div>

                            {expense.description && (
                                <div className="border-t pt-3">
                                    <span className="text-xs text-muted-foreground block mb-1">Keterangan / Keperluan</span>
                                    <p className="text-sm bg-muted/30 p-2 rounded">{expense.description}</p>
                                </div>
                            )}

                            {expense.notes && (
                                <div className="border-t pt-3">
                                    <span className="text-xs text-muted-foreground block mb-1">Catatan Persetujuan / Penolakan</span>
                                    <p className="text-sm text-muted-foreground italic bg-muted/20 p-2 rounded">
                                        {expense.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Receipt className="h-4 w-4" />
                                    Bukti Fisik / Nota
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {expense.proof_path ? (
                                    <div className="border rounded-md p-2 bg-muted/20 text-center">
                                        {expense.proof_path.toLowerCase().endsWith('.pdf') ? (
                                            <div className="py-6 space-y-2">
                                                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground">Dokumen Bukti PDF</p>
                                            </div>
                                        ) : (
                                            <img
                                                src={`/storage/${expense.proof_path}`}
                                                alt="Nota Pengeluaran"
                                                className="max-h-60 mx-auto rounded object-contain"
                                                onError={(e) => {
                                                    // Fallback if direct storage link isn't configured
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                                            <a
                                                href={`/storage/${expense.proof_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                Buka Nota Lengkap
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Tidak ada bukti terlampir.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Linimasa Persetujuan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-income mt-0.5" />
                                    <div>
                                        <p className="font-medium">Diajukan</p>
                                        <p className="text-xs text-muted-foreground">
                                            Oleh {expense.submitter.name} ({formatDate(expense.date)})
                                        </p>
                                    </div>
                                </div>

                                {expense.approved_at && (
                                    <div className="flex items-start gap-2">
                                        <UserCheck className="h-4 w-4 text-info mt-0.5" />
                                        <div>
                                            <p className="font-medium">Disetujui</p>
                                            <p className="text-xs text-muted-foreground">
                                                Oleh {expense.approver?.name ?? 'Pejabat'} ({formatDateTime(expense.approved_at)})
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {expense.paid_at && (
                                    <div className="flex items-start gap-2">
                                        <CreditCard className="h-4 w-4 text-income mt-0.5" />
                                        <div>
                                            <p className="font-medium text-income">Dibayarkan ke Buku Besar</p>
                                            <p className="text-xs text-muted-foreground">Waktu: {formatDateTime(expense.paid_at)}</p>
                                        </div>
                                    </div>
                                )}

                                {expense.status === 'rejected' && (
                                    <div className="flex items-start gap-2">
                                        <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                                        <div>
                                            <p className="font-medium text-destructive">Pengajuan Ditolak</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
