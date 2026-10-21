import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Lock, LockOpen, PlusCircle } from 'lucide-react';

interface PeriodRow {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    closed_at?: string | null;
    closer?: { id: number; name: string } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administrasi', href: '/admin/settings' },
    { title: 'Periode Akuntansi', href: '/admin/periods' },
];

export default function PeriodsIndex({ periods }: { periods: Paginated<PeriodRow> }) {
    const handleClosePeriod = (period: PeriodRow) => {
        if (
            confirm(
                `PERINGATAN: Apakah Anda yakin ingin menutup periode akuntansi '${period.name}' (${period.start_date} s/d ${period.end_date})?\n\nSetelah ditutup, sistem akan MENOLAK seluruh transaksi baru (pengeluaran, penerimaan/hitung, maupun pemindahan dana) pada rentang tanggal tersebut.`
            )
        ) {
            router.post(route('admin.periods.close', period.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Periode Akuntansi & Tutup Buku" />
            <div className="space-y-6 p-4">
                <PageHeader
                    title="Periode Akuntansi"
                    description="Kelola periode pembukuan kas gereja, pencatatan saldo awal, dan penutupan periode (tutup buku)."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.periods.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Buat Periode Baru
                            </Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Periode</TableHead>
                            <TableHead>Tanggal Mulai</TableHead>
                            <TableHead>Tanggal Selesai</TableHead>
                            <TableHead>Status Pembukuan</TableHead>
                            <TableHead>Waktu Penutupan</TableHead>
                            <TableHead>Ditutup Oleh</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {periods.data.map((period) => (
                            <TableRow key={period.id}>
                                <TableCell className="font-semibold">{period.name}</TableCell>
                                <TableCell className="font-mono text-sm">{period.start_date}</TableCell>
                                <TableCell className="font-mono text-sm">{period.end_date}</TableCell>
                                <TableCell>
                                    {period.is_closed ? (
                                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                            <Lock className="h-3 w-3" />
                                            Periode Ditutup
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-emerald-600 text-white flex items-center gap-1 w-fit">
                                            <LockOpen className="h-3 w-3" />
                                            Periode Terbuka
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {period.closed_at ?? '-'}
                                </TableCell>
                                <TableCell className="text-sm">{period.closer?.name ?? '-'}</TableCell>
                                <TableCell className="text-right">
                                    {!period.is_closed ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950"
                                            onClick={() => handleClosePeriod(period)}
                                        >
                                            <Lock className="h-4 w-4 mr-1" />
                                            Tutup Periode
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">
                                            Terkunci Permanen
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {periods.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    <CalendarDays className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    Belum ada catatan periode akuntansi.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={periods.links} />
            </div>
        </AppLayout>
    );
}
