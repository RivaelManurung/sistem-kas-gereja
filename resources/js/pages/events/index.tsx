import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem, type EventItem, type EventStatus, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, PartyPopper, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Acara & Kepanitiaan', href: '/events' }];

const statusLabels: Record<EventStatus, string> = {
    planning: 'Perencanaan',
    active: 'Berjalan',
    completed: 'Selesai',
    closed: 'Ditutup',
};

const statusVariants: Record<EventStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    planning: 'secondary',
    active: 'default',
    completed: 'outline',
    closed: 'outline',
};

export default function EventsIndex({
    events,
    filters,
}: {
    events: Paginated<EventItem>;
    filters: { status?: string; search?: string };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleFilter = (newSearch?: string, newStatus?: string) => {
        const s = newSearch !== undefined ? newSearch : search;
        const st = newStatus !== undefined ? newStatus : status;

        router.get(
            route('events.index'),
            {
                search: s || undefined,
                status: st !== 'all' ? st : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Acara & Kepanitiaan" />
            <div className="space-y-6 p-4">
                <PageHeader
                    title="Acara & Kepanitiaan"
                    description="Kelola program kepanitiaan gereja, alokasi dana khusus, pencatatan pemasukan, dan pertanggungjawaban pengeluaran."
                    actions={
                        <Button asChild>
                            <Link href={route('events.create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Buat Acara Baru
                            </Link>
                        </Button>
                    }
                />

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama acara atau tema..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        handleFilter(e.target.value, undefined);
                                    }}
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <Select
                                    value={status}
                                    onValueChange={(val) => {
                                        setStatus(val);
                                        handleFilter(undefined, val);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="planning">Perencanaan</SelectItem>
                                        <SelectItem value="active">Berjalan</SelectItem>
                                        <SelectItem value="completed">Selesai</SelectItem>
                                        <SelectItem value="closed">Ditutup</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Acara & Tema</TableHead>
                                <TableHead>Periode Pelaksanaan</TableHead>
                                <TableHead>Pos Dana Khusus</TableHead>
                                <TableHead className="text-right">Target Anggaran</TableHead>
                                <TableHead className="text-right">Pemasukan / Pengeluaran</TableHead>
                                <TableHead className="text-right">Sisa Saldo</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        <PartyPopper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        Belum ada acara yang terdaftar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.data.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{event.name}</div>
                                            {event.theme && (
                                                <div className="text-xs text-muted-foreground italic">
                                                    "{event.theme}"
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{event.start_date}</span>
                                                {event.end_date && <span>s/d {event.end_date}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {event.fund ? (
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {event.fund.code}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono tabular-nums text-sm">
                                            {formatRupiah(event.target_budget)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono tabular-nums text-xs">
                                            <div className="text-emerald-600 dark:text-emerald-400">
                                                +{formatRupiah(event.financial_summary?.total_income)}
                                            </div>
                                            <div className="text-rose-600 dark:text-rose-400">
                                                -{formatRupiah(event.financial_summary?.total_expenses)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono tabular-nums font-semibold text-sm">
                                            {formatRupiah(event.financial_summary?.remaining_balance)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusVariants[event.status]}>
                                                {statusLabels[event.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={route('events.show', event.id)}>
                                                    Detail
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination links={events.links} />
            </div>
        </AppLayout>
    );
}
