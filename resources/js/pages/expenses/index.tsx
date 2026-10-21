import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Eye, FileText, PlusCircle, Receipt } from 'lucide-react';

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
                return <Badge className="bg-amber-500 text-white">Menunggu Persetujuan</Badge>;
            case 'approved':
                return <Badge className="bg-blue-600 text-white">Disetujui (Siap Bayar)</Badge>;
            case 'paid':
                return <Badge className="bg-emerald-600 text-white">Sudah Dibayar</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengeluaran Kas Gereja" />
            <div className="space-y-6 p-4">
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
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.data.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell className="font-mono text-xs font-semibold">
                                    {expense.expense_number}
                                </TableCell>
                                <TableCell className="font-mono text-sm">{expense.date}</TableCell>
                                <TableCell className="font-medium">{expense.payee}</TableCell>
                                <TableCell>{expense.category.name}</TableCell>
                                <TableCell>{expense.fund.name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {expense.account.name}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-rose-600">
                                    {formatRupiah(expense.amount)}
                                </TableCell>
                                <TableCell className="text-sm">{expense.submitter.name}</TableCell>
                                <TableCell>{getStatusBadge(expense.status)}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={route('expenses.show', expense.id)}>
                                            <Eye className="h-4 w-4 mr-1" />
                                            Detail
                                        </Link>
                                    </Button>
                                    {expense.status === 'pending' && (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={route('expenses.approve.view', expense.id)}>
                                                <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" />
                                                Persetujuan
                                            </Link>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {expenses.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                    <Receipt className="mx-auto h-8 w-8 mb-2 opacity-50" />
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
