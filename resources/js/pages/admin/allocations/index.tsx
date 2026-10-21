import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, PlusCircle, Split } from 'lucide-react';

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
    { title: 'Master Data', href: '#' },
    { title: 'Aturan Alokasi Dana', href: '/admin/allocations' },
];

export default function AllocationsIndex({ rules }: { rules: Paginated<AllocationRuleRow> }) {
    const toggleActive = (id: number) => {
        router.patch(route('admin.allocations.toggle', id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Aturan Alokasi Pos Dana" />
            <div className="space-y-6 p-4">
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
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.data.map((rule) => (
                            <TableRow key={rule.id}>
                                <TableCell className="font-semibold">{rule.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{rule.category.name}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{rule.valid_from}</TableCell>
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
                                    <Button
                                        size="sm"
                                        variant={rule.is_active ? 'default' : 'secondary'}
                                        onClick={() => toggleActive(rule.id)}
                                    >
                                        {rule.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={route('admin.allocations.edit', rule.id)}>
                                            <Edit className="mr-1 h-3.5 w-3.5" />
                                            Edit
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rules.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    <Split className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    Belum ada aturan alokasi berversi yang dibuat.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={rules.links} />
            </div>
        </AppLayout>
    );
}
