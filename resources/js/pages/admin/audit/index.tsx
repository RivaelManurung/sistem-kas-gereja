import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Filter, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface AuditLogItem {
    id: number;
    user: string | null;
    auditable_type: string;
    auditable_id: number;
    event: 'created' | 'updated' | 'deleted' | string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
}

interface Props {
    logs: Paginated<AuditLogItem>;
    filters: {
        type: string;
        from: string;
        to: string;
    };
    types: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dasbor', href: '/dashboard' },
    { title: 'Audit Trail', href: '/admin/audit' },
];

function formatEventBadge(event: string) {
    switch (event) {
        case 'created':
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Dibuat</span>;
        case 'updated':
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Diubah</span>;
        case 'deleted':
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">Dihapus</span>;
        default:
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">{event}</span>;
    }
}

export default function AuditLogIndex({ logs, filters, types }: Props) {
    const [selectedType, setSelectedType] = useState<string>(filters.type || 'all');
    const [from, setFrom] = useState<string>(filters.from || '');
    const [to, setTo] = useState<string>(filters.to || '');

    const handleFilter = () => {
        router.get('/admin/audit', {
            type: selectedType === 'all' ? '' : selectedType,
            from: from || undefined,
            to: to || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        setSelectedType('all');
        setFrom('');
        setTo('');
        router.get('/admin/audit', {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Trail (Jejak Rekam)" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Audit Trail (Jejak Rekam)
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Catatan kronologis semua perubahan data, pembuatan, pembaruan, dan penghapusan entitas sistem.
                    </p>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="h-4 w-4" /> Filter Jejak Rekam
                        </CardTitle>
                        <CardDescription>
                            Saring riwayat aktivitas berdasarkan tipe entitas dan rentang tanggal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label htmlFor="type-filter">Tipe Entitas</Label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger id="type-filter">
                                        <SelectValue placeholder="Semua Tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Tipe</SelectItem>
                                        {types.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="date-from">Dari Tanggal</Label>
                                <Input
                                    id="date-from"
                                    type="date"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="date-to">Sampai Tanggal</Label>
                                <Input
                                    id="date-to"
                                    type="date"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button className="flex-1" onClick={handleFilter}>
                                    Terapkan
                                </Button>
                                <Button variant="outline" size="icon" onClick={handleReset} title="Reset Filter">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">ID</TableHead>
                                        <TableHead className="w-40">Waktu</TableHead>
                                        <TableHead>Pengguna</TableHead>
                                        <TableHead>Aksi</TableHead>
                                        <TableHead>Entitas</TableHead>
                                        <TableHead>ID Entitas</TableHead>
                                        <TableHead>Rincian Perubahan</TableHead>
                                        <TableHead className="w-32">IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                Tidak ada catatan audit yang cocok dengan filter.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.data.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-mono text-xs">{log.id}</TableCell>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm">
                                                    {log.user ?? <span className="text-muted-foreground italic">Sistem</span>}
                                                </TableCell>
                                                <TableCell>{formatEventBadge(log.event)}</TableCell>
                                                <TableCell className="font-mono text-xs">{log.auditable_type}</TableCell>
                                                <TableCell className="font-mono text-xs">#{log.auditable_id}</TableCell>
                                                <TableCell className="text-xs max-w-md">
                                                    <details className="cursor-pointer">
                                                        <summary className="text-primary hover:underline font-mono">
                                                            {log.new_values ? Object.keys(log.new_values).join(', ') : 'Lihat Data'}
                                                        </summary>
                                                        <pre className="mt-2 p-2 rounded bg-muted/60 text-[10px] overflow-x-auto max-h-40">
                                                            {JSON.stringify({ lama: log.old_values, baru: log.new_values }, null, 2)}
                                                        </pre>
                                                    </details>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {log.ip_address ?? '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {logs.links && logs.links.length > 3 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-xs text-muted-foreground">
                                    Menampilkan {logs.data.length} dari total {logs.total} jejak rekam
                                </div>
                                <div className="flex gap-1">
                                    {logs.links.map((link, idx) => (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
