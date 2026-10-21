import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { EventBadge, type AuditEntry } from './index';

interface Props {
    log: AuditEntry & { changes: Array<{ label: string; old: string; new: string }> };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Jejak Aktivitas', href: '/admin/audit' },
    { title: 'Detail', href: '#' },
];

export default function AuditLogShow({ log }: Props) {
    const showBoth = log.event === 'updated';
    const single = log.event === 'deleted' ? 'old' : 'new';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Aktivitas" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader title={log.sentence} description={`${log.entity} · ${formatDateTime(log.created_at)}`} />

                <div className="grid items-start gap-6 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader>
                            <CardTitle>{showBoth ? 'Perubahan' : log.event === 'deleted' ? 'Data yang dihapus' : 'Data yang dicatat'}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 md:p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kolom</TableHead>
                                        {showBoth ? (
                                            <>
                                                <TableHead>Sebelum</TableHead>
                                                <TableHead>Sesudah</TableHead>
                                            </>
                                        ) : (
                                            <TableHead>Isi</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {log.changes.map((c) => (
                                        <TableRow key={c.label}>
                                            <TableCell className="text-muted-foreground w-56">{c.label}</TableCell>
                                            {showBoth ? (
                                                <>
                                                    <TableCell className="text-muted-foreground">{c.old}</TableCell>
                                                    <TableCell className="font-medium">{c.new}</TableCell>
                                                </>
                                            ) : (
                                                <TableCell className="font-medium">{c[single]}</TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {log.changes.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                                                Tidak ada rincian kolom untuk aktivitas ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="divide-border divide-y text-sm">
                                {[
                                    ['Aksi', <EventBadge key="e" event={log.event} label={log.event_label} />],
                                    ['Dilakukan oleh', log.actor],
                                    ['Waktu', formatDateTime(log.created_at)],
                                    ['Jenis data', log.entity],
                                    ['Alamat IP', log.ip_address ?? '-'],
                                ].map(([k, v]) => (
                                    <div key={String(k)} className="flex items-center justify-between gap-4 py-3">
                                        <dt className="text-muted-foreground">{k}</dt>
                                        <dd className="text-right font-medium">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
