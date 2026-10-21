import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, PlusCircle, XCircle } from 'lucide-react';

interface TransferRow {
    id: number;
    amount: number;
    transfer_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string | null;
    from_fund: { id: number; name: string };
    to_fund: { id: number; name: string };
    account: { id: number; name: string };
    requester: { id: number; name: string };
    approver?: { id: number; name: string } | null;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pindah Dana', href: '/transfers' }];

export default function TransfersIndex({
    transfers,
    canApproveRole,
    currentUserId,
}: {
    transfers: Paginated<TransferRow>;
    canApproveRole: boolean;
    currentUserId?: number;
}) {
    const [approving, setApproving] = useState<TransferRow | null>(null);

    const handleApprove = (transfer: TransferRow) => {
        router.post(route('transfers.approve', transfer.id));
    };

    const handleReject = (transfer: TransferRow) => {
        const reason = prompt('Masukkan alasan penolakan:');
        if (reason) {
            router.post(route('transfers.reject', transfer.id), { notes: reason });
        }
    };

    const getStatusBadge = (status: TransferRow['status']) => {
        switch (status) {
            case 'pending':
                return <Badge className="border-warning/30 bg-warning/10 text-warning">Menunggu Persetujuan</Badge>;
            case 'approved':
                return <Badge className="border-income/30 bg-income/10 text-income">Disetujui & Dibukukan</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pindah Dana Antar-Pos" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Pindah Dana Antar-Pos"
                    description="Pemindahan alokasi dana antar pos dana gereja (misal: Kas Umum menutup kekurangan Diakonia)."
                    actions={
                        <Button asChild>
                            <Link href={route('transfers.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajukan Pindah Dana
                            </Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Dari Pos Dana</TableHead>
                            <TableHead></TableHead>
                            <TableHead>Ke Pos Dana</TableHead>
                            <TableHead>Rekening</TableHead>
                            <TableHead className="text-right">Nominal</TableHead>
                            <TableHead>Alasan</TableHead>
                            <TableHead>Pemohon</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transfers.data.map((transfer) => {
                            const canApproveThis =
                                canApproveRole &&
                                transfer.status === 'pending' &&
                                (!currentUserId || transfer.requester.id !== currentUserId);

                            return (
                                <LinkRow key={transfer.id} href={route('transfers.show', transfer.id)}>
                                    <TableCell className="text-sm">{formatDate(transfer.transfer_date)}</TableCell>
                                    <TableCell className="font-semibold text-expense">
                                        {transfer.from_fund.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <ArrowRight className="h-4 w-4" />
                                    </TableCell>
                                    <TableCell className="font-semibold text-income">
                                        {transfer.to_fund.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {transfer.account.name}
                                    </TableCell>
                                    <TableCell className="text-right font-bold tabular-nums">
                                        {formatRupiah(transfer.amount)}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-xs">
                                        {transfer.reason}
                                    </TableCell>
                                    <TableCell className="text-sm">{transfer.requester.name}</TableCell>
                                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <RowActions
                                            actions={[
                                                { label: 'Lihat detail', icon: Eye, href: route('transfers.show', transfer.id) },
                                                {
                                                    label: 'Setujui',
                                                    icon: CheckCircle2,
                                                    onSelect: () => setApproving(transfer),
                                                    hidden: !canApproveThis,
                                                },
                                                {
                                                    label: 'Tolak',
                                                    icon: XCircle,
                                                    onSelect: () => handleReject(transfer),
                                                    destructive: true,
                                                    separated: true,
                                                    hidden: !canApproveThis,
                                                },
                                            ]}
                                        />
                                    </TableCell>
                                </LinkRow>
                            );
                        })}
                        {transfers.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                                                                        Belum ada permohonan pemindahan dana antar-pos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={transfers.links} />

                <ConfirmDialog
                    open={approving !== null}
                    onOpenChange={(open) => !open && setApproving(null)}
                    title="Setujui pindah dana?"
                    description={
                        approving
                            ? `${formatRupiah(approving.amount)} akan dipindahkan dari ${approving.from_fund.name} ke ${approving.to_fund.name} dan langsung dibukukan di buku besar.`
                            : ''
                    }
                    confirmLabel="Setujui"
                    onConfirm={() => {
                        if (approving) handleApprove(approving);
                        setApproving(null);
                    }}
                />
            </div>
        </AppLayout>
    );
}
