import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/app/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';

interface ScheduleDetail {
    id: number;
    name: string;
    time: string;
    is_active: boolean;
}

interface SessionRow {
    id: number;
    date: string;
    name: string;
    is_completed: boolean;
}

export default function ScheduleShow({
    schedule,
    dayName,
    categories,
    sessions,
    sessionsCount,
}: {
    schedule: ScheduleDetail;
    dayName: string;
    categories: Array<{ id: number; name: string }>;
    sessions: SessionRow[];
    sessionsCount: number;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jadwal Ibadah', href: route('admin.schedules.index') },
        { title: schedule.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Jadwal ${schedule.name}`} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('admin.schedules.index')}
                    title={schedule.name}
                    description={`Jadwal ibadah rutin setiap hari ${dayName} pukul ${schedule.time}`}
                    actions={
                        <>
                            <Button asChild>
                                <Link href={route('admin.schedules.edit', schedule.id)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Ubah
                                </Link>
                            </Button>
                        </>
                    }
                />

                <StatTiles items={[{ label: 'Sesi yang dibuat dari jadwal ini', value: sessionsCount }]} />

                <DetailCard title="Informasi jadwal">
                    <DefinitionList
                        items={[
                            { label: 'Nama ibadah', value: schedule.name },
                            { label: 'Hari', value: dayName },
                            { label: 'Waktu', value: schedule.time },
                            { label: 'Status', value: <StatusBadge active={schedule.is_active} /> },
                            {
                                label: 'Kategori kolekte bawaan',
                                value:
                                    categories.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {categories.map((c) => (
                                                <Badge key={c.id} variant="outline">
                                                    {c.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : null,
                            },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Sesi terbaru" description="20 sesi terakhir yang dibuat dari jadwal ini." flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24">
                                    <span className="sr-only">Aksi</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="text-sm">{formatDate(s.date)}</TableCell>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={s.is_completed ? 'default' : 'outline'}>{s.is_completed ? 'Selesai' : 'Terbuka'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={route('sessions.show', s.id)}>Buka</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sessions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                                        Belum ada sesi dari jadwal ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DetailCard>
            </div>
        </AppLayout>
    );
}
