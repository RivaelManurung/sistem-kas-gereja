import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

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
    const toggle = (cat: CategoryRow) => {
        const verb = cat.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${verb} kategori ${cat.name}?`)) {
            router.patch(route('admin.categories.toggle', cat.id), {}, { preserveScroll: true });
        }
    };

    const handleTabChange = (val: string) => {
        router.get(route('admin.categories.index'), { direction: val }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Kas" />
            <div className="space-y-6 p-4">
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
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.data.map((cat) => (
                            <TableRow key={cat.id}>
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
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={route('admin.categories.edit', cat.id)}>Edit</Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggle(cat)}>
                                        {cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </Button>
                                </TableCell>
                            </TableRow>
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
            </div>
        </AppLayout>
    );
}
