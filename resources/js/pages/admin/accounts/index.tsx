import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface AccountRow {
    id: number;
    code: string;
    name: string;
    type: 'cash' | 'petty_cash' | 'bank';
    bank_name: string | null;
    account_number: string | null;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Rekening', href: '/admin/accounts' }];

const typeLabels: Record<string, string> = {
    cash: 'Kas Tunai',
    petty_cash: 'Kas Kecil',
    bank: 'Bank',
};

export default function AccountsIndex({ accounts }: { accounts: Paginated<AccountRow> }) {
    const toggle = (account: AccountRow) => {
        const verb = account.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${verb} rekening ${account.name}?`)) {
            router.patch(route('admin.accounts.toggle', account.id), {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekening" />
            <div className="space-y-6 p-4">
                <PageHeader
                    title="Rekening / Kas"
                    description="Kelola rekening bank dan kas tunai fisik yang digunakan dalam transaksi gereja."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.accounts.create')}>Tambah Rekening</Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Detail Bank</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.data.map((account) => (
                            <TableRow key={account.id}>
                                <TableCell className="font-mono font-medium">{account.code}</TableCell>
                                <TableCell>{account.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{typeLabels[account.type] ?? account.type}</Badge>
                                </TableCell>
                                <TableCell>
                                    {account.type === 'bank' ? (
                                        <span className="text-sm">
                                            {account.bank_name} - {account.account_number}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge active={account.is_active} />
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={route('admin.accounts.edit', account.id)}>Edit</Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggle(account)}>
                                        {account.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {accounts.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    Belum ada data rekening.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={accounts.links} />
            </div>
        </AppLayout>
    );
}
