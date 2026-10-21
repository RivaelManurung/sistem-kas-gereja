import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { RowActions } from '@/components/app/row-actions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Power } from 'lucide-react';
import { useState } from 'react';

interface ScheduleRow {
    id: number;
    name: string;
    day_of_week: number;
    time: string;
    is_active: boolean;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Jadwal Ibadah', href: '/admin/schedules' }];

export default function SchedulesIndex({ schedules }: { schedules: Paginated<ScheduleRow> }) {
    const [target, setTarget] = useState<ScheduleRow | null>(null);

    const confirmToggle = () => {
        if (!target) return;
        router.patch(route('admin.schedules.toggle', target.id), {}, { preserveScroll: true });
        setTarget(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jadwal Ibadah" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Jadwal Ibadah Rutin"
                    description="Template jadwal ibadah berulang yang digunakan untuk membuat sesi penghitungan kolekte."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.schedules.create')}>Tambah Jadwal</Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Ibadah</TableHead>
                            <TableHead>Hari</TableHead>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schedules.data.map((schedule) => (
                            <TableRow key={schedule.id}>
                                <TableCell className="font-medium">{schedule.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{dayNames[schedule.day_of_week]}</Badge>
                                </TableCell>
                                <TableCell className="font-mono">{schedule.time}</TableCell>
                                <TableCell>
                                    <StatusBadge active={schedule.is_active} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Ubah', icon: Pencil, href: route('admin.schedules.edit', schedule.id) },
                                            {
                                                label: schedule.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: Power,
                                                onSelect: () => setTarget(schedule),
                                                destructive: schedule.is_active,
                                                separated: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {schedules.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Belum ada jadwal ibadah rutin.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={schedules.links} />

                <ConfirmDialog
                    open={target !== null}
                    onOpenChange={(open) => !open && setTarget(null)}
                    title={target?.is_active ? 'Nonaktifkan jadwal?' : 'Aktifkan jadwal?'}
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
