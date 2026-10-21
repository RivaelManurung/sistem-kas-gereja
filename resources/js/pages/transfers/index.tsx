import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeftRight, ArrowRight, CheckCircle2, PlusCircle, XCircle } from 'lucide-react';

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
    const handleApprove = (transfer: TransferRow) => {
        if (
            confirm(
                `Setujui pemindahan dana ${formatRupiah(transfer.amount)} dari ${transfer.from_fund.name} ke ${transfer.to_fund.name}?`
            )
        ) {
            router.post(route('transfers.approve', transfer.id));
        }
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
                return <Badge className="bg-amber-500 text-white">Menunggu Persetujuan</Badge>;
            case 'approved':
                return <Badge className="bg-emerald-600 text-white">Disetujui & Dibukukan</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pindah Dana Antar-Pos" />
            <div className="space-y-6 p-4">
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
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transfers.data.map((transfer) => {
                            const canApproveThis =
                                canApproveRole &&
                                transfer.status === 'pending' &&
                                (!currentUserId || transfer.requester.id !== currentUserId);

                            return (
                                <TableRow key={transfer.id}>
                                    <TableCell className="font-mono text-sm">{transfer.transfer_date}</TableCell>
                                    <TableCell className="font-semibold text-rose-600">
                                        {transfer.from_fund.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <ArrowRight className="h-4 w-4" />
                                    </TableCell>
                                    <TableCell className="font-semibold text-emerald-600">
                                        {transfer.to_fund.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {transfer.account.name}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {formatRupiah(transfer.amount)}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-xs">
                                        {transfer.reason}
                                    </TableCell>
                                    <TableCell className="text-sm">{transfer.requester.name}</TableCell>
                                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {canApproveThis ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-emerald-600 hover:text-emerald-700"
                                                    onClick={() => handleApprove(transfer)}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    Setujui
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleReject(transfer)}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Tolak
                                                </Button>
                                            </>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {transfers.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                    <ArrowLeftRight className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    Belum ada permohonan pemindahan dana antar-pos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={transfers.links} />
            </div>
        </AppLayout>
    );
}
