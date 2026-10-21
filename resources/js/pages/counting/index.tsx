import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Eye, PlusCircle } from 'lucide-react';

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
            return <Badge className="border-warning/30 bg-warning/10 text-warning">Terverifikasi Bendahara</Badge>;
        case 'locked':
            return <Badge className="bg-muted text-foreground hover:bg-muted/60">Terkunci (Buku Besar)</Badge>;
    }
};

export default function CountingIndex({ sheets }: { sheets: Paginated<SheetSummary> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Berita Acara Penghitungan Kolekte" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
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
                            <TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sheets.data.map((sheet) => (
                            <LinkRow key={sheet.id} href={route('counting.show', sheet.id)}>
                                <TableCell>
                                    <span className="font-semibold">BA-{String(sheet.id).padStart(5, '0')}</span>
                                    <div className="text-muted-foreground text-xs">{formatDate(sheet.date)}</div>
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
                                <TableCell className="text-right font-semibold tabular-nums">
                                    {formatRupiah(sheet.total_amount)}
                                </TableCell>
                                <TableCell>{statusBadge(sheet.status)}</TableCell>
                                <TableCell className="text-right">
                                    <RowActions actions={[{ label: 'Lihat detail', icon: Eye, href: route('counting.show', sheet.id) }]} />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {sheets.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
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
