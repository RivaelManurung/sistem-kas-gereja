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
import { CheckCircle2, Eye, PlusCircle } from 'lucide-react';

interface ExpenseRow {
    id: number;
    expense_number: string;
    payee: string;
    amount: number;
    date: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    account: { id: number; name: string };
    fund: { id: number; name: string };
    category: { id: number; name: string };
    submitter: { id: number; name: string };
    approver?: { id: number; name: string } | null;
}

interface FundOption {
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pengeluaran Kas', href: '/expenses' }];

export default function ExpensesIndex({
    expenses,
    funds,
    filters,
    threshold,
}: {
    expenses: Paginated<ExpenseRow>;
    funds: FundOption[];
    filters: { status?: string; fund_id?: string };
    threshold: number;
}) {
    const getStatusBadge = (status: ExpenseRow['status']) => {
        switch (status) {
            case 'pending':
                return <Badge className="border-warning/30 bg-warning/10 text-warning">Menunggu Persetujuan</Badge>;
            case 'approved':
                return <Badge className="border-info/30 bg-info/10 text-info">Disetujui (Siap Bayar)</Badge>;
            case 'paid':
                return <Badge className="border-income/30 bg-income/10 text-income">Sudah Dibayar</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengeluaran Kas Gereja" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Pengeluaran Kas"
                    description="Pengajuan, persetujuan bertingkat, dan pembayaran kas operasional serta pelayanan gereja."
                    actions={
                        <Button asChild>
                            <Link href={route('expenses.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajukan Pengeluaran
                            </Link>
                        </Button>
                    }
                />

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant={!filters.status ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href={route('expenses.index')}>Semua</Link>
                    </Button>
                    <Button
                        variant={filters.status === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href={route('expenses.index', { status: 'pending' })}>
                            Menunggu Persetujuan
                        </Link>
                    </Button>
                    <Button
                        variant={filters.status === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href={route('expenses.index', { status: 'approved' })}>
                            Siap Dibayar
                        </Link>
                    </Button>
                    <Button
                        variant={filters.status === 'paid' ? 'default' : 'outline'}
                        size="sm"
                        asChild
                    >
                        <Link href={route('expenses.index', { status: 'paid' })}>
                            Sudah Dibayar
                        </Link>
                    </Button>
                    {threshold > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                            Ambang persetujuan Majelis: {formatRupiah(threshold)}
                        </span>
                    )}
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Pengeluaran</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Penerima</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Pos Dana</TableHead>
                            <TableHead>Rekening</TableHead>
                            <TableHead className="text-right">Nominal</TableHead>
                            <TableHead>Pengaju</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.data.map((expense) => (
                            <LinkRow key={expense.id} href={route('expenses.show', expense.id)}>
                                <TableCell className="font-mono text-xs font-semibold">
                                    {expense.expense_number}
                                </TableCell>
                                <TableCell className="text-sm">{formatDate(expense.date)}</TableCell>
                                <TableCell className="font-medium">{expense.payee}</TableCell>
                                <TableCell>{expense.category.name}</TableCell>
                                <TableCell>{expense.fund.name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {expense.account.name}
                                </TableCell>
                                <TableCell className="text-right font-bold text-expense tabular-nums">
                                    {formatRupiah(expense.amount)}
                                </TableCell>
                                <TableCell className="text-sm">{expense.submitter.name}</TableCell>
                                <TableCell>{getStatusBadge(expense.status)}</TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('expenses.show', expense.id) },
                                            {
                                                label: 'Persetujuan',
                                                icon: CheckCircle2,
                                                href: route('expenses.approve.view', expense.id),
                                                hidden: expense.status !== 'pending',
                                                separated: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {expenses.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                                                                        Belum ada catatan pengeluaran kas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={expenses.links} />
            </div>
        </AppLayout>
    );
}
