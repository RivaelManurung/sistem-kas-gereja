import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calculator, PlusCircle } from 'lucide-react';

interface SheetSummary {
    id: number;
    type: 'service' | 'general' | 'event';
    date: string;
    status: 'draft' | 'confirmed' | 'verified' | 'locked';
    total_amount: number;
    service_session: {
        id: number;
        name: string;
    } | null;
    account: {
        id: number;
        name: string;
    };
    creator: {
        id: number;
        name: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Berita Acara Hitung', href: '/counting' }];

const statusBadge = (status: SheetSummary['status']) => {
    switch (status) {
        case 'draft':
            return <Badge variant="outline">Draf</Badge>;
        case 'confirmed':
            return <Badge variant="secondary">Terkonfirmasi</Badge>;
        case 'verified':
            return <Badge className="bg-amber-600 text-white hover:bg-amber-700">Terverifikasi Bendahara</Badge>;
        case 'locked':
            return <Badge className="bg-slate-700 text-slate-100 hover:bg-slate-800 dark:bg-slate-800 dark:text-slate-200">Terkunci (Buku Besar)</Badge>;
    }
};

export default function CountingIndex({ sheets }: { sheets: Paginated<SheetSummary> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Berita Acara Penghitungan Kolekte" />
            <div className="space-y-6 p-4">
                <PageHeader
                    title="Berita Acara Penghitungan"
                    description="Pencatatan fisik kolekte ibadah, persembahan amplop, dan penerimaan umum."
                    actions={
                        <Button asChild>
                            <Link href={route('counting.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Hitung Baru
                            </Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomor / Tanggal</TableHead>
                            <TableHead>Jenis & Sesi</TableHead>
                            <TableHead>Rekening Masuk</TableHead>
                            <TableHead>Pencatat</TableHead>
                            <TableHead className="text-right">Total Fisik</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sheets.data.map((sheet) => (
                            <TableRow key={sheet.id}>
                                <TableCell>
                                    <span className="font-semibold">BA-{String(sheet.id).padStart(5, '0')}</span>
                                    <div className="text-muted-foreground text-xs">{sheet.date}</div>
                                </TableCell>
                                <TableCell>
                                    {sheet.service_session ? (
                                        <div className="font-medium">{sheet.service_session.name}</div>
                                    ) : (
                                        <div className="font-medium capitalize">{sheet.type}</div>
                                    )}
                                </TableCell>
                                <TableCell>{sheet.account.name}</TableCell>
                                <TableCell>{sheet.creator?.name ?? '-'}</TableCell>
                                <TableCell className="text-right font-mono font-semibold tabular-nums">
                                    {formatRupiah(sheet.total_amount)}
                                </TableCell>
                                <TableCell>{statusBadge(sheet.status)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={route('counting.show', sheet.id)}>Lihat Detail</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sheets.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    <Calculator className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    Belum ada berita acara penghitungan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={sheets.links} />
            </div>
        </AppLayout>
    );
}
