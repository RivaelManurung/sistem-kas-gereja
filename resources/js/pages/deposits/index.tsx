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
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Eye, PlusCircle } from 'lucide-react';

interface DepositRow {
    id: number;
    deposit_date: string;
    amount: number;
    reference_number: string | null;
    status: string;
    from_account: {
        id: number;
        name: string;
    };
    to_account: {
        id: number;
        name: string;
        bank_name: string | null;
    };
    creator: {
        id: number;
        name: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Setoran Bank', href: '/deposits' }];

export default function DepositsIndex({ deposits }: { deposits: Paginated<DepositRow> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Setoran Kas Tunai ke Bank" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Setoran Bank"
                    description="Pencatatan perpindahan fisik uang kas tunai ke rekening bank operasional gereja."
                    actions={
                        <Button asChild>
                            <Link href={route('deposits.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Catat Setoran Bank
                            </Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal Setor</TableHead>
                            <TableHead>Dari Rekening (Kas)</TableHead>
                            <TableHead></TableHead>
                            <TableHead>Ke Rekening (Bank)</TableHead>
                            <TableHead>No. Referensi / Slip</TableHead>
                            <TableHead className="text-right">Nominal</TableHead>
                            <TableHead>Petugas</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deposits.data.map((deposit) => (
                            <LinkRow key={deposit.id} href={route('deposits.show', deposit.id)}>
                                <TableCell className="text-sm">{formatDate(deposit.deposit_date)}</TableCell>
                                <TableCell className="font-medium">{deposit.from_account.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    <ArrowRight className="h-4 w-4" />
                                </TableCell>
                                <TableCell className="font-semibold text-primary">
                                    {deposit.to_account.name}
                                    {deposit.to_account.bank_name && (
                                        <span className="text-xs text-muted-foreground ml-1 font-normal">
                                            ({deposit.to_account.bank_name})
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {deposit.reference_number ?? '-'}
                                </TableCell>
                                <TableCell className="text-right font-bold tabular-nums">
                                    {formatRupiah(deposit.amount)}
                                </TableCell>
                                <TableCell className="text-sm">{deposit.creator?.name ?? '-'}</TableCell>
                                <TableCell>
                                    <Badge className="border-income/30 bg-income/10 text-income">Tercatat di Buku Besar</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions actions={[{ label: 'Lihat detail', icon: Eye, href: route('deposits.show', deposit.id) }]} />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {deposits.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                                                                        Belum ada catatan setoran bank.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={deposits.links} />
            </div>
        </AppLayout>
    );
}
