import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';

interface CategoryOption {
    id: number;
    name: string;
}

interface DonationRow {
    id: number;
    receipt_number: string;
    donor_name: string | null;
    member: {
        id: number;
        name: string;
        membership_number: string;
    } | null;
    category: {
        id: number;
        name: string;
    };
    amount: number;
    payment_method: string;
    created_at: string;
    count_sheet_id: number | null;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Persembahan Atas Nama', href: '/donations' }];

export default function DonationsIndex({
    donations,
    categories,
    filters,
}: {
    donations: Paginated<DonationRow>;
    categories: CategoryOption[];
    filters: { search?: string; category_id?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('donations.index'), { ...filters, search }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Persembahan Atas Nama & Tanda Terima" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Persembahan Atas Nama"
                    description="Pencatatan persembahan perpuluhan, syukur, dan janji iman yang memerlukan tanda terima jemaat."
                    actions={
                        <Button asChild>
                            <Link href={route('donations.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Catat Persembahan
                            </Link>
                        </Button>
                    }
                />

                <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                    <Input
                        placeholder="Cari no tanda terima, nama donatur, atau jemaat..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button type="submit" variant="secondary">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Tanda Terima</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Nama Jemaat / Donatur</TableHead>
                            <TableHead>Pos Persembahan</TableHead>
                            <TableHead>Metode</TableHead>
                            <TableHead className="text-right">Nominal</TableHead>
                            <TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {donations.data.map((donation) => (
                            <LinkRow key={donation.id} href={route('donations.show', donation.id)}>
                                <TableCell className="font-mono font-semibold text-primary">
                                    {donation.receipt_number}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {new Date(donation.created_at).toLocaleDateString('id-ID')}
                                </TableCell>
                                <TableCell>
                                    {donation.member ? (
                                        <div>
                                            <span className="font-medium">{donation.member.name}</span>
                                            <span className="text-xs text-muted-foreground ml-1.5 font-mono">
                                                ({donation.member.membership_number})
                                            </span>
                                        </div>
                                    ) : (
                                        <span>{donation.donor_name ?? 'Anonim'}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{donation.category.name}</Badge>
                                </TableCell>
                                <TableCell className="capitalize text-xs">{donation.payment_method}</TableCell>
                                <TableCell className="text-right font-bold tabular-nums">
                                    {formatRupiah(donation.amount)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions actions={[{ label: 'Lihat kwitansi', icon: Eye, href: route('donations.show', donation.id) }]} />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {donations.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                                    Belum ada catatan persembahan atas nama.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={donations.links} />
            </div>
        </AppLayout>
    );
}
