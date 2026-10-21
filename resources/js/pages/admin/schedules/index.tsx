import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

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
    const toggle = (schedule: ScheduleRow) => {
        const verb = schedule.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${verb} jadwal ${schedule.name}?`)) {
            router.patch(route('admin.schedules.toggle', schedule.id), {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jadwal Ibadah" />
            <div className="space-y-6 p-4">
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
                            <TableHead className="text-right">Aksi</TableHead>
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
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={route('admin.schedules.edit', schedule.id)}>Ubah</Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggle(schedule)}>
                                        {schedule.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </Button>
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
            </div>
        </AppLayout>
    );
}
