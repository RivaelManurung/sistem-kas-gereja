import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Power } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Officer {
    role: string;
    role_key: string;
    name: string;
}

interface WilayahRow {
    id: number;
    name: string;
    code: string | null;
    meeting_info: string | null;
    households_count: number;
    members_count: number;
    is_active: boolean;
    officers: Officer[];
}

interface Props {
    wilayahs: WilayahRow[];
    filters: { search?: string | null; aktif?: string | null };
    totals: { wilayah: number; households: number; unassigned: number };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Wilayah', href: '/admin/wilayah' }];

export default function WilayahIndex({ wilayahs, filters, totals }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [aktif, setAktif] = useState(filters.aktif || 'semua');
    const [loading, setLoading] = useState(false);
    const [target, setTarget] = useState<WilayahRow | null>(null);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get(
                route('admin.wilayah.index'),
                { search: search || undefined, aktif: aktif === 'semua' ? undefined : aktif },
                { preserveState: true, preserveScroll: true, replace: true, onStart: () => setLoading(true), onFinish: () => setLoading(false) },
            );
        }, 300);
        return () => clearTimeout(t);
    }, [search, aktif]);

    const description = `${totals.wilayah} wilayah${totals.unassigned > 0 ? `, ${totals.unassigned} keluarga belum punya wilayah` : ''}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wilayah" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Wilayah"
                    description={description}
                    actions={
                        <Button asChild>
                            <Link href={route('admin.wilayah.create')}>Tambah Wilayah</Link>
                        </Button>
                    }
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau kode wilayah" aria-label="Cari wilayah" className="sm:max-w-sm" />
                    <Select value={aktif} onValueChange={setAktif}>
                        <SelectTrigger className="sm:w-44" aria-label="Status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semua">Semua status</SelectItem>
                            <SelectItem value="1">Aktif</SelectItem>
                            <SelectItem value="0">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className={cn('transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Wilayah</TableHead>
                                <TableHead>Penatua</TableHead>
                                <TableHead>Pengurus lain</TableHead>
                                <TableHead>Keluarga</TableHead>
                                <TableHead>Jemaat</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12">
                                    <span className="sr-only">Aksi</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wilayahs.map((w) => {
                                const penatua = w.officers.filter((o) => o.role_key === 'penatua').map((o) => o.name);
                                const others = w.officers.filter((o) => o.role_key !== 'penatua').map((o) => `${o.role}: ${o.name}`);
                                return (
                                    <LinkRow key={w.id} href={route('admin.wilayah.show', w.id)}>
                                        <TableCell>
                                            <span className="font-medium">{w.name}</span>
                                            {w.code && <span className="text-muted-foreground block text-xs">Wilayah {w.code}</span>}
                                        </TableCell>
                                        <TableCell>{penatua.length ? penatua.join(', ') : <span className="text-muted-foreground">-</span>}</TableCell>
                                        <TableCell className="text-sm">
                                            {others.length === 0 ? (
                                                <span className="text-muted-foreground">-</span>
                                            ) : (
                                                <>
                                                    {others.slice(0, 2).map((o) => (
                                                        <span key={o} className="block">
                                                            {o}
                                                        </span>
                                                    ))}
                                                    {others.length > 2 && <span className="text-muted-foreground block text-xs">+{others.length - 2} lainnya</span>}
                                                </>
                                            )}
                                        </TableCell>
                                        <TableCell className="tabular-nums">{w.households_count}</TableCell>
                                        <TableCell className="tabular-nums">{w.members_count}</TableCell>
                                        <TableCell>
                                            <StatusBadge active={w.is_active} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <RowActions
                                                actions={[
                                                    { label: 'Lihat detail', icon: Eye, href: route('admin.wilayah.show', w.id) },
                                                    { label: 'Ubah', icon: Pencil, href: route('admin.wilayah.edit', w.id) },
                                                    { label: w.is_active ? 'Nonaktifkan' : 'Aktifkan', icon: Power, destructive: w.is_active, separated: true, onSelect: () => setTarget(w) },
                                                ]}
                                            />
                                        </TableCell>
                                    </LinkRow>
                                );
                            })}
                            {wilayahs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                                        Tidak ada wilayah yang cocok.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <ConfirmDialog
                open={target !== null}
                onOpenChange={(o) => !o && setTarget(null)}
                title={target?.is_active ? `Nonaktifkan ${target?.name}?` : `Aktifkan ${target?.name}?`}
                description={target?.is_active ? 'Wilayah ini tidak muncul lagi sebagai pilihan baru. Keluarga, pengurus, dan datanya tetap tersimpan.' : 'Wilayah ini tersedia kembali sebagai pilihan.'}
                confirmLabel={target?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                destructive={target?.is_active}
                onConfirm={() => target && router.patch(route('admin.wilayah.toggle', target.id), {}, { preserveScroll: true, onFinish: () => setTarget(null) })}
            />
        </AppLayout>
    );
}
