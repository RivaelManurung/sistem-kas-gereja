import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Power } from 'lucide-react';
import { useState } from 'react';

interface FundSummary {
    id: number;
    code: string;
    name: string;
}

interface CategoryRow {
    id: number;
    name: string;
    direction: 'in' | 'out';
    default_fund_id: number;
    default_fund: FundSummary;
    allows_named: boolean;
    is_public: boolean;
    is_active: boolean;
    sort_order: number;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Kategori', href: '/admin/categories' }];

export default function CategoriesIndex({
    categories,
    currentDirection,
}: {
    categories: Paginated<CategoryRow>;
    currentDirection: 'in' | 'out';
}) {
    const [target, setTarget] = useState<CategoryRow | null>(null);

    const confirmToggle = () => {
        if (!target) return;
        router.patch(route('admin.categories.toggle', target.id), {}, { preserveScroll: true });
        setTarget(null);
    };

    const handleTabChange = (val: string) => {
        router.get(route('admin.categories.index'), { direction: val }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Kas" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Kategori Pemasukan & Pengeluaran"
                    description="Klasifikasi pos transaksi keuangan gereja dan pemetaan dana default-nya."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.categories.create')}>Tambah Kategori</Link>
                        </Button>
                    }
                />

                <Tabs value={currentDirection} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full max-w-xs grid-cols-2">
                        <TabsTrigger value="in">Pemasukan</TabsTrigger>
                        <TabsTrigger value="out">Pengeluaran</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Urutan</TableHead>
                            <TableHead>Nama Kategori</TableHead>
                            <TableHead>Dana Default</TableHead>
                            {currentDirection === 'in' && <TableHead>Atas Nama</TableHead>}
                            <TableHead>Tampil Publik</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.data.map((cat) => (
                            <LinkRow key={cat.id} href={route('admin.categories.show', cat.id)}>
                                <TableCell className="font-mono text-muted-foreground">{cat.sort_order}</TableCell>
                                <TableCell className="font-medium">{cat.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {cat.default_fund?.code} - {cat.default_fund?.name}
                                    </Badge>
                                </TableCell>
                                {currentDirection === 'in' && (
                                    <TableCell>
                                        <Badge variant={cat.allows_named ? 'default' : 'secondary'}>
                                            {cat.allows_named ? 'Bisa' : 'Tidak'}
                                        </Badge>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Badge variant={cat.is_public ? 'outline' : 'secondary'}>
                                        {cat.is_public ? 'Tampil' : 'Disembunyikan'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge active={cat.is_active} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('admin.categories.show', cat.id) },
                                            { label: 'Ubah', icon: Pencil, href: route('admin.categories.edit', cat.id) },
                                            {
                                                label: cat.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: Power,
                                                onSelect: () => setTarget(cat),
                                                destructive: cat.is_active,
                                                separated: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {categories.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Belum ada kategori {currentDirection === 'in' ? 'pemasukan' : 'pengeluaran'}.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={categories.links} />

                <ConfirmDialog
                    open={target !== null}
                    onOpenChange={(open) => !open && setTarget(null)}
                    title={target?.is_active ? 'Nonaktifkan kategori?' : 'Aktifkan kategori?'}
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
