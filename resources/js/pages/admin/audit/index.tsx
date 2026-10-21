import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Eye, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export interface AuditEntry {
    id: number;
    created_at: string;
    actor: string;
    event: string;
    event_label: string;
    entity: string;
    entity_type: string;
    subject: string;
    sentence: string;
    change_count: number;
    ip_address: string | null;
}

interface Props {
    logs: Paginated<AuditEntry>;
    filters: { type: string; from: string; to: string };
    types: Array<{ value: string; label: string }>;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Jejak Aktivitas', href: '/admin/audit' }];

export const EVENT_TONE: Record<string, string> = {
    created: 'bg-income/10 text-income',
    updated: 'bg-info/10 text-info',
    deleted: 'bg-expense/10 text-expense',
};

export function EventBadge({ event, label }: { event: string; label: string }) {
    return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', EVENT_TONE[event] ?? 'bg-muted text-foreground')}>{label}</span>;
}

export default function AuditLogIndex({ logs, filters, types }: Props) {
    const [type, setType] = useState(filters.type || 'all');
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const apply = () => {
        router.get('/admin/audit', { type: type === 'all' ? '' : type, from, to }, { preserveState: true, replace: true });
    };

    const reset = () => {
        setType('all');
        setFrom('');
        setTo('');
        router.get('/admin/audit', {}, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jejak Aktivitas" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader title="Jejak Aktivitas" description="Siapa mengubah apa dan kapan. Catatan ini tidak bisa diubah atau dihapus." />

                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="w-full space-y-1.5 sm:w-56">
                        <Label>Jenis data</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua jenis</SelectItem>
                                {types.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full space-y-1.5 sm:w-48">
                        <Label>Dari tanggal</Label>
                        <DatePicker value={from} onChange={setFrom} clearable />
                    </div>
                    <div className="w-full space-y-1.5 sm:w-48">
                        <Label>Sampai tanggal</Label>
                        <DatePicker value={to} onChange={setTo} clearable min={from || undefined} />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={apply}>Terapkan</Button>
                        <Button variant="outline" size="icon" onClick={reset} aria-label="Atur ulang filter">
                            <RotateCcw className="size-4" />
                        </Button>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-44">Waktu</TableHead>
                            <TableHead className="w-28">Aksi</TableHead>
                            <TableHead>Aktivitas</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.data.map((log) => (
                            <LinkRow key={log.id} href={`/admin/audit/${log.id}`}>
                                <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">{formatDateTime(log.created_at)}</TableCell>
                                <TableCell>
                                    <EventBadge event={log.event} label={log.event_label} />
                                </TableCell>
                                <TableCell>
                                    <p className="font-medium">{log.sentence}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {log.entity}
                                        {log.event === 'updated' && log.change_count > 0 ? ` · ${log.change_count} kolom berubah` : ''}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions actions={[{ label: 'Lihat detail', icon: Eye, href: `/admin/audit/${log.id}` }]} />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {logs.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                                    Tidak ada aktivitas pada filter ini.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={logs.links} />
            </div>
        </AppLayout>
    );
}
