import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import StatusBadge from '@/components/app/status-badge';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calculator } from 'lucide-react';

interface CountSheetRow {
    id: number;
    status: string;
    total_amount: number;
    date: string;
}

interface SessionDetail {
    id: number;
    name: string;
    date: string;
    notes: string | null;
    is_completed: boolean;
    schedule: { id: number; name: string; time: string } | null;
    count_sheets: CountSheetRow[];
}

export default function SessionShow({ session, totalCollected }: { session: SessionDetail; totalCollected: number }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Sesi Ibadah', href: route('sessions.index') },
        { title: `${session.name} - ${formatDate(session.date)}`, href: '#' },
    ];
    const sheets = session.count_sheets ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Sesi ${session.name}`} />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={session.name}
                    description={`Sesi ibadah tanggal ${formatDate(session.date)}`}
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={route('sessions.index')}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali
                                </Link>
                            </Button>
                            {sheets.length === 0 && (
                                <Button asChild>
                                    <Link href={`${route('counting.create')}?session_id=${session.id}`}>
                                        <Calculator className="mr-2 h-4 w-4" />
                                        Buat berita acara
                                    </Link>
                                </Button>
                            )}
                        </>
                    }
                />

                <StatTiles
                    items={[
                        { label: 'Total kolekte', value: formatRupiah(totalCollected), tone: 'income' },
                        { label: 'Berita acara', value: sheets.length },
                    ]}
                />

                <DetailCard title="Informasi sesi">
                    <DefinitionList
                        items={[
                            { label: 'Nama ibadah', value: session.name },
                            { label: 'Tanggal', value: formatDate(session.date) },
                            {
                                label: 'Jadwal induk',
                                value: session.schedule ? `${session.schedule.name} (${session.schedule.time})` : 'Insidental / Khusus',
                            },
                            { label: 'Status', value: <Badge variant={session.is_completed ? 'default' : 'outline'}>{session.is_completed ? 'Selesai' : 'Terbuka'}</Badge> },
                            { label: 'Catatan', value: session.notes },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Berita acara penghitungan" description="Hasil penghitungan kolekte pada sesi ini." flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No.</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-24">
                                    <span className="sr-only">Aksi</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sheets.map((sheet) => (
                                <TableRow key={sheet.id}>
                                    <TableCell className="font-medium">BA-{sheet.id}</TableCell>
                                    <TableCell className="text-sm">{formatDate(sheet.date)}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={sheet.status} />
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatRupiah(sheet.total_amount)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={route('counting.show', sheet.id)}>Buka</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sheets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                                        Belum ada berita acara untuk sesi ini.
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
