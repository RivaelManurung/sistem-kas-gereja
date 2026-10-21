import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Power } from 'lucide-react';
import { useState } from 'react';

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
    const [target, setTarget] = useState<AccountRow | null>(null);

    const confirmToggle = () => {
        if (!target) return;
        router.patch(route('admin.accounts.toggle', target.id), {}, { preserveScroll: true });
        setTarget(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekening" />
            <div className="space-y-6 p-4 md:p-6">
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
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.data.map((account) => (
                            <LinkRow key={account.id} href={route('admin.accounts.show', account.id)}>
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
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('admin.accounts.show', account.id) },
                                            { label: 'Ubah', icon: Pencil, href: route('admin.accounts.edit', account.id) },
                                            {
                                                label: account.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: Power,
                                                onSelect: () => setTarget(account),
                                                destructive: account.is_active,
                                                separated: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
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

                <ConfirmDialog
                    open={target !== null}
                    onOpenChange={(open) => !open && setTarget(null)}
                    title={target?.is_active ? 'Nonaktifkan rekening?' : 'Aktifkan rekening?'}
                    description={
                        target?.is_active
                            ? `${target?.name} tidak akan muncul lagi sebagai pilihan baru. Data lama tetap tersimpan dan bisa diaktifkan kembali.`
                            : `${target?.name} akan tersedia kembali sebagai pilihan.`
                    }
                    confirmLabel={target?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    destructive={target?.is_active}
                    onConfirm={confirmToggle}
                />
            </div>
        </AppLayout>
    );
}
