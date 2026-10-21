import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface FundRow {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dana', href: '/admin/funds' }];

export default function FundsIndex({ funds }: { funds: Paginated<FundRow> }) {
    const toggle = (fund: FundRow) => {
        const verb = fund.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${verb} dana ${fund.name}?`)) {
            router.patch(route('admin.funds.toggle', fund.id), {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dana" />
            <div className="space-y-6 p-4">
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
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {funds.data.map((fund) => (
                            <TableRow key={fund.id}>
                                <TableCell className="font-mono font-medium">{fund.code}</TableCell>
                                <TableCell className="font-medium">{fund.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{fund.description ?? '-'}</TableCell>
                                <TableCell>
                                    <StatusBadge active={fund.is_active} />
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={route('admin.funds.edit', fund.id)}>Ubah</Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggle(fund)}>
                                        {fund.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </Button>
                                </TableCell>
                            </TableRow>
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
            </div>
        </AppLayout>
    );
}
