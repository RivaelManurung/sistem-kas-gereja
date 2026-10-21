import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calculator, PlusCircle } from 'lucide-react';

interface ScheduleSummary {
    id: number;
    name: string;
    time: string;
}

interface CountSheetSummary {
    id: number;
    status: string;
    total_amount: number;
}

interface SessionRow {
    id: number;
    name: string;
    date: string;
    notes: string | null;
    is_completed: boolean;
    schedule: ScheduleSummary | null;
    count_sheets: CountSheetSummary[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Sesi Ibadah', href: '/sessions' }];

export default function SessionsIndex({ sessions }: { sessions: Paginated<SessionRow> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sesi Ibadah" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Sesi Ibadah & Kegiatan"
                    description="Daftar ibadah yang berlangsung untuk penghitungan kolekte dan pencatatan kehadiran."
                    actions={
                        <Button asChild>
                            <Link href={route('sessions.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Buka Sesi Ibadah
                            </Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Nama Ibadah</TableHead>
                            <TableHead>Jadwal Induk</TableHead>
                            <TableHead>Berita Acara</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.data.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell className="text-sm">{formatDate(session.date)}</TableCell>
                                <TableCell className="font-medium">{session.name}</TableCell>
                                <TableCell>
                                    {session.schedule ? (
                                        <Badge variant="outline">
                                            {session.schedule.name} ({session.schedule.time})
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">Insidental / Khusus</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {session.count_sheets && session.count_sheets.length > 0 ? (
                                        <Badge variant="secondary">
                                            {session.count_sheets.length} Berita Acara
                                        </Badge>
                                    ) : (
                                        <span className="text-warning text-xs font-medium">Belum dihitung</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={session.is_completed ? 'default' : 'outline'}>
                                        {session.is_completed ? 'Selesai' : 'Terbuka'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[{ label: 'Hitung Kolekte', icon: Calculator, href: `/counting/create?session_id=${session.id}` }]}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {sessions.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                                    Belum ada sesi ibadah yang dibuka. Klik &quot;Buka Sesi Ibadah&quot; untuk memulai.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={sessions.links} />
            </div>
        </AppLayout>
    );
}
