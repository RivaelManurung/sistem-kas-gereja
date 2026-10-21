import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import { LedgerEntriesTable, type LedgerEntryRow } from '@/components/app/ledger-entries-table';
import StatusBadge from '@/components/app/status-badge';
import PageHeader from '@/components/page-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime } from '@/lib/date';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface TransferDetail {
    id: number;
    amount: number;
    transfer_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    approved_at: string | null;
    from_fund: { id: number; name: string };
    to_fund: { id: number; name: string };
    account: { id: number; name: string };
    requester: { id: number; name: string } | null;
    approver: { id: number; name: string } | null;
}

export default function TransferShow({
    transfer,
    canApprove,
    fromBalance,
    ledgerEntries,
}: {
    transfer: TransferDetail;
    canApprove: boolean;
    fromBalance: number;
    ledgerEntries: LedgerEntryRow[];
}) {
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pindah Dana', href: route('transfers.index') },
        { title: `${transfer.from_fund.name} ke ${transfer.to_fund.name}`, href: '#' },
    ];

    const submitReject = () => {
        if (!reason.trim()) {
            setError('Alasan penolakan pindah dana wajib diisi.');
            return;
        }
        setError(null);
        router.post(
            route('transfers.reject', transfer.id),
            { notes: reason.trim() },
            {
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onError: (errors) => setError(errors.notes ?? 'Penolakan gagal diproses.'),
                onSuccess: () => setRejectOpen(false),
            },
        );
    };

    const decided = transfer.status !== 'pending';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Pindah Dana" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={`${transfer.from_fund.name} ke ${transfer.to_fund.name}`}
                    description={`Permohonan pindah dana tanggal ${formatDate(transfer.transfer_date)}`}
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={route('transfers.index')}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali
                                </Link>
                            </Button>
                            {canApprove && (
                                <>
                                    <Button variant="outline" onClick={() => setRejectOpen(true)}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Tolak
                                    </Button>
                                    <Button onClick={() => setApproveOpen(true)}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Setujui
                                    </Button>
                                </>
                            )}
                        </>
                    }
                />

                <StatTiles
                    items={[
                        { label: 'Nominal', value: formatRupiah(transfer.amount) },
                        { label: `Saldo ${transfer.from_fund.name}`, value: formatRupiah(fromBalance), hint: 'Saldo saat ini di buku besar' },
                    ]}
                />

                <DetailCard title="Informasi pindah dana">
                    <DefinitionList
                        items={[
                            { label: 'Dari pos dana', value: transfer.from_fund.name },
                            { label: 'Ke pos dana', value: transfer.to_fund.name },
                            { label: 'Rekening', value: transfer.account.name },
                            { label: 'Tanggal', value: formatDate(transfer.transfer_date) },
                            { label: 'Status', value: <StatusBadge status={transfer.status} /> },
                            { label: 'Pemohon', value: transfer.requester?.name },
                            { label: transfer.status === 'rejected' ? 'Ditolak oleh' : 'Disetujui oleh', value: transfer.approver?.name, hidden: !decided },
                            { label: transfer.status === 'rejected' ? 'Ditolak pada' : 'Disetujui pada', value: transfer.approved_at ? formatDateTime(transfer.approved_at) : null, hidden: !decided },
                            { label: 'Alasan', value: transfer.reason },
                            { label: transfer.status === 'rejected' ? 'Alasan penolakan' : 'Catatan', value: transfer.notes },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Entri buku besar" description="Entri yang dihasilkan setelah pindah dana disetujui." flush>
                    <LedgerEntriesTable entries={ledgerEntries} empty="Belum ada entri buku besar. Entri dibuat setelah permohonan disetujui." />
                </DetailCard>

                <ConfirmDialog
                    open={approveOpen}
                    onOpenChange={setApproveOpen}
                    title="Setujui pindah dana?"
                    description={`${formatRupiah(transfer.amount)} akan dipindahkan dari ${transfer.from_fund.name} ke ${transfer.to_fund.name} dan langsung dibukukan di buku besar.`}
                    confirmLabel="Setujui"
                    onConfirm={() => {
                        setApproveOpen(false);
                        router.post(route('transfers.approve', transfer.id));
                    }}
                />

                <Dialog
                    open={rejectOpen}
                    onOpenChange={(open) => {
                        setRejectOpen(open);
                        if (!open) {
                            setError(null);
                            setReason('');
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tolak pindah dana</DialogTitle>
                            <DialogDescription>Alasan penolakan akan tersimpan dan dapat dilihat pemohon.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="reject-reason">Alasan penolakan</Label>
                            <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={4} required aria-invalid={!!error} />
                            <InputError message={error ?? undefined} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectOpen(false)}>
                                Batal
                            </Button>
                            <Button variant="destructive" onClick={submitReject} disabled={processing}>
                                Tolak
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
