import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, PlusCircle, Power } from 'lucide-react';
import { useState } from 'react';

interface AllocationRuleRow {
    id: number;
    name: string;
    valid_from: string;
    is_active: boolean;
    category: {
        id: number;
        name: string;
    };
    items: Array<{
        id: number;
        percentage: number;
        fund: {
            id: number;
            name: string;
        };
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Aturan Alokasi Dana', href: '/admin/allocations' },
];

export default function AllocationsIndex({ rules }: { rules: Paginated<AllocationRuleRow> }) {
    const [target, setTarget] = useState<AllocationRuleRow | null>(null);

    const confirmToggle = () => {
        if (!target) return;
        router.patch(route('admin.allocations.toggle', target.id), {}, { preserveScroll: true });
        setTarget(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aturan Alokasi Pos Dana" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Aturan Alokasi Pos Dana"
                    description="Pembagian persentase persembahan ke pos dana gereja (berlaku bertanggal/berversi)."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.allocations.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Tambah Aturan
                            </Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Aturan</TableHead>
                            <TableHead>Kategori Persembahan</TableHead>
                            <TableHead>Berlaku Mulai</TableHead>
                            <TableHead>Rincian Pembagian Pos Dana</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.data.map((rule) => (
                            <LinkRow key={rule.id} href={route('admin.allocations.show', rule.id)}>
                                <TableCell className="font-semibold">{rule.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{rule.category.name}</Badge>
                                </TableCell>
                                <TableCell className="text-sm">{formatDate(rule.valid_from)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1.5">
                                        {rule.items.map((item) => (
                                            <Badge key={item.id} variant="secondary" className="font-mono text-xs">
                                                {item.fund.name}: {item.percentage}%
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge active={rule.is_active} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('admin.allocations.show', rule.id) },
                                            { label: 'Ubah', icon: Pencil, href: route('admin.allocations.edit', rule.id) },
                                            {
                                                label: rule.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: Power,
                                                onSelect: () => setTarget(rule),
                                                destructive: rule.is_active,
                                                separated: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {rules.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Belum ada aturan alokasi berversi yang dibuat.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={rules.links} />

                <ConfirmDialog
                    open={target !== null}
                    onOpenChange={(open) => !open && setTarget(null)}
                    title={target?.is_active ? 'Nonaktifkan aturan alokasi?' : 'Aktifkan aturan alokasi?'}
                    description={
                        target?.is_active
                            ? `Aturan "${target?.name}" tidak lagi dipakai untuk membagi persembahan baru ke pos dana. Data lama tidak berubah.`
                            : `Aturan "${target?.name}" akan dipakai kembali untuk membagi persembahan baru ke pos dana.`
                    }
                    confirmLabel={target?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    destructive={target?.is_active}
                    onConfirm={confirmToggle}
                />
            </div>
        </AppLayout>
    );
}
