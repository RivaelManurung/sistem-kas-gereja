import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Lock, LockOpen, PlusCircle } from 'lucide-react';
import { useState } from 'react';

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
    const [target, setTarget] = useState<PeriodRow | null>(null);

    const confirmClose = () => {
        if (!target) return;
        router.post(route('admin.periods.close', target.id));
        setTarget(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Periode Akuntansi & Tutup Buku" />
            <div className="space-y-6 p-4 md:p-6">
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
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {periods.data.map((period) => (
                            <LinkRow key={period.id} href={route('admin.periods.show', period.id)}>
                                <TableCell className="font-semibold">{period.name}</TableCell>
                                <TableCell className="text-sm">{formatDate(period.start_date)}</TableCell>
                                <TableCell className="text-sm">{formatDate(period.end_date)}</TableCell>
                                <TableCell>
                                    {period.is_closed ? (
                                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                            <Lock className="h-3 w-3" />
                                            Periode Ditutup
                                        </Badge>
                                    ) : (
                                        <Badge className="border-income/30 bg-income/10 text-income flex items-center gap-1 w-fit">
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
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('admin.periods.show', period.id) },
                                            {
                                                label: 'Tutup periode',
                                                icon: Lock,
                                                onSelect: () => setTarget(period),
                                                destructive: true,
                                                hidden: period.is_closed,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {periods.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Belum ada catatan periode akuntansi.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={periods.links} />

                <ConfirmDialog
                    open={target !== null}
                    onOpenChange={(open) => !open && setTarget(null)}
                    title={`Tutup periode ${target?.name ?? ''}?`}
                    description={`Setelah ditutup, sistem menolak seluruh transaksi baru (pengeluaran, penerimaan, dan pemindahan dana) pada ${formatDate(target?.start_date)} s/d ${formatDate(target?.end_date)}. Periode yang sudah ditutup terkunci permanen.`}
                    confirmLabel="Tutup periode"
                    destructive
                    onConfirm={confirmClose}
                />
            </div>
        </AppLayout>
    );
}
