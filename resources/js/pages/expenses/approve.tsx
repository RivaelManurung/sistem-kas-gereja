import PageHeader from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Receipt,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ExpenseDetail {
    id: number;
    expense_number: string;
    payee: string;
    amount: number;
    date: string;
    status: string;
    description?: string | null;
    proof_path: string;
    account: { id: number; name: string };
    fund: { id: number; name: string };
    category: { id: number; name: string };
    submitter: { id: number; name: string };
}

export default function ExpensesApprove({
    expense,
    fundBalance,
    setting,
    canApprove,
    needsMajelis,
}: {
    expense: ExpenseDetail;
    fundBalance: number;
    setting: { expense_approval_threshold: number; allow_negative_balance: boolean };
    canApprove: boolean;
    needsMajelis: boolean;
}) {
    const [notes, setNotes] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pengeluaran Kas', href: '/expenses' },
        { title: expense.expense_number, href: route('expenses.show', expense.id) },
        { title: 'Persetujuan', href: '#' },
    ];

    const isBalanceInsufficient = fundBalance < expense.amount && !setting.allow_negative_balance;

    const handleApprove = () => {
        router.post(route('expenses.approve', expense.id), { notes });
    };

    const handleReject = () => {
        if (!rejectNotes.trim()) {
            alert('Mohon cantumkan alasan penolakan.');
            return;
        }
        router.post(route('expenses.reject', expense.id), { notes: rejectNotes });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Persetujuan Pengeluaran ${expense.expense_number}`} />
            <div className="space-y-6 p-4 md:p-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={route('expenses.show', expense.id)}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Kembali ke Detail
                    </Link>
                </Button>

                <PageHeader
                    title={`Persetujuan Pengeluaran #${expense.expense_number}`}
                    description={`Verifikasi dan tinjau keabsahan pengeluaran sebelum disetujui.`}
                />

                {isBalanceInsufficient && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Peringatan Saldo Pos Dana</AlertTitle>
                        <AlertDescription>
                            Saldo pos dana <strong>{expense.fund.name}</strong> ({formatRupiah(fundBalance)}) tidak
                            mencukupi untuk nominal pengeluaran ({formatRupiah(expense.amount)}).
                        </AlertDescription>
                    </Alert>
                )}

                {needsMajelis && (
                    <Alert className="bg-warning/10 border-warning/30 text-warning">
                        <Clock className="h-4 w-4 text-warning" />
                        <AlertTitle>Wewenang Persetujuan Majelis / Ketua</AlertTitle>
                        <AlertDescription>
                            Karena nominal pengeluaran ({formatRupiah(expense.amount)}) melebihi ambang batas{' '}
                            ({formatRupiah(setting.expense_approval_threshold)}), persetujuan hanya dapat dilakukan oleh Majelis atau Admin.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informasi Pengeluaran</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <span className="text-xs text-muted-foreground block">Nominal</span>
                                <span className="text-xl font-bold text-expense tabular-nums">
                                    {formatRupiah(expense.amount)}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Penerima</span>
                                <span className="font-medium">{expense.payee}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Pos Dana Beban</span>
                                <span className="font-semibold text-primary">{expense.fund.name}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Kategori</span>
                                <span>{expense.category.name}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Diajukan Oleh</span>
                                <span>{expense.submitter.name}</span>
                            </div>
                            {expense.description && (
                                <div>
                                    <span className="text-xs text-muted-foreground block">Keperluan</span>
                                    <p className="bg-muted/30 p-2 rounded text-xs">{expense.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Bukti Nota Terlampir
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-center">
                            {expense.proof_path ? (
                                <div className="border rounded p-2 bg-muted/20">
                                    {expense.proof_path.toLowerCase().endsWith('.pdf') ? (
                                        <div className="py-6">
                                            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground mt-1">Dokumen PDF</p>
                                        </div>
                                    ) : (
                                        <img
                                            src={`/storage/${expense.proof_path}`}
                                            alt="Nota"
                                            className="max-h-48 mx-auto rounded object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                    <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                                        <a href={`/storage/${expense.proof_path}`} target="_blank" rel="noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            Lihat Ukuran Penuh
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Tidak ada nota.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Keputusan Persetujuan</CardTitle>
                        <CardDescription>
                            Pilih untuk menyetujui agar pengeluaran siap dibayarkan oleh Bendahara, atau tolak dengan alasan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isRejecting ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Catatan Persetujuan (Opsional)</span>
                                    <Textarea
                                        placeholder="cth. Telah diperiksa dan sesuai anggaran komisi..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsRejecting(true)}>
                                        <XCircle className="h-4 w-4 mr-1 text-destructive" />
                                        Tolak Pengeluaran
                                    </Button>
                                    <Button
                                        className="border-income/30 bg-income/10 text-income"
                                        onClick={handleApprove}
                                        disabled={!canApprove || isBalanceInsufficient}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Setujui Pengeluaran
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                                <h4 className="font-semibold text-destructive">Formulir Penolakan Pengeluaran</h4>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Alasan Penolakan (Wajib)</span>
                                    <Textarea
                                        placeholder="Jelaskan alasan pengeluaran ini ditolak..."
                                        value={rejectNotes}
                                        onChange={(e) => setRejectNotes(e.target.value)}
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsRejecting(false)}>
                                        Batal
                                    </Button>
                                    <Button variant="destructive" onClick={handleReject}>
                                        Konfirmasi Penolakan
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
