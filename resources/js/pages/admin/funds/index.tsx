import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
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

interface FundRow {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dana', href: '/admin/funds' }];

export default function FundsIndex({ funds }: { funds: Paginated<FundRow> }) {
    const [target, setTarget] = useState<FundRow | null>(null);

    const confirmToggle = () => {
        if (!target) return;
        router.patch(route('admin.funds.toggle', target.id), {}, { preserveScroll: true });
        setTarget(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dana" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Dana Kas"
                    description="Kelola pos dana (alokasi keuangan) gereja seperti Kas Umum, Dana Pembangunan, dan Diakonia."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.funds.create')}>Tambah Dana</Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {funds.data.map((fund) => (
                            <LinkRow key={fund.id} href={route('admin.funds.show', fund.id)}>
                                <TableCell className="font-mono font-medium">{fund.code}</TableCell>
                                <TableCell className="font-medium">{fund.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{fund.description ?? '-'}</TableCell>
                                <TableCell>
                                    <StatusBadge active={fund.is_active} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('admin.funds.show', fund.id) },
                                            { label: 'Ubah', icon: Pencil, href: route('admin.funds.edit', fund.id) },
                                            {
                                                label: fund.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: Power,
                                                onSelect: () => setTarget(fund),
                                                destructive: fund.is_active,
                                                separated: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {funds.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Belum ada data dana.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={funds.links} />

                <ConfirmDialog
                    open={target !== null}
                    onOpenChange={(open) => !open && setTarget(null)}
                    title={target?.is_active ? 'Nonaktifkan dana?' : 'Aktifkan dana?'}
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
