import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Power } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface HouseholdRow {
    id: number;
    name: string;
    family_number: string | null;
    head: string | null;
    wilayah: string | null;
    members_count: number;
    address: string | null;
    phone: string | null;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Keluarga', href: '/admin/households' }];

export default function HouseholdsIndex({ households, filters }: { households: Paginated<HouseholdRow>; filters: { search?: string | null; aktif?: string | null } }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [aktif, setAktif] = useState(filters.aktif || 'semua');
    const [loading, setLoading] = useState(false);
    const [target, setTarget] = useState<HouseholdRow | null>(null);
    const first = useRef(true);

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get(
                route('admin.households.index'),
                { search: search || undefined, aktif: aktif === 'semua' ? undefined : aktif },
                { preserveState: true, preserveScroll: true, replace: true, onStart: () => setLoading(true), onFinish: () => setLoading(false) },
            );
        }, 300);
        return () => clearTimeout(t);
    }, [search, aktif]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Keluarga" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Keluarga"
                    description="Kelompokkan jemaat ke dalam keluarga untuk melihat hubungan dan alamat bersama."
                    actions={
                        <>
                            <Button asChild variant="outline">
                                <Link href={route('admin.members.index')}>Data jemaat</Link>
                            </Button>
                            <Button asChild>
                                <Link href={route('admin.households.create')}>Tambah keluarga</Link>
                            </Button>
                        </>
                    }
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama keluarga atau nomor keluarga" aria-label="Cari keluarga" className="sm:max-w-sm" />
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
                                <TableHead>Keluarga</TableHead>
                                <TableHead>Kepala keluarga</TableHead>
                                <TableHead>Wilayah</TableHead>
                                <TableHead>Anggota</TableHead>
                                <TableHead>Alamat</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12">
                                    <span className="sr-only">Aksi</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {households.data.map((h) => (
                                <LinkRow key={h.id} href={route('admin.households.show', h.id)}>
                                    <TableCell>
                                        <span className="font-medium">{h.name}</span>
                                        {h.family_number && <span className="text-muted-foreground block text-xs">{h.family_number}</span>}
                                    </TableCell>
                                    <TableCell>{h.head ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                    <TableCell>{h.wilayah ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                    <TableCell className="tabular-nums">{h.members_count}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs truncate">{h.address ?? '-'}</TableCell>
                                    <TableCell>
                                        <StatusBadge active={h.is_active} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <RowActions
                                            actions={[
                                                { label: 'Lihat detail', icon: Eye, href: route('admin.households.show', h.id) },
                                                { label: 'Ubah', icon: Pencil, href: route('admin.households.edit', h.id) },
                                                { label: h.is_active ? 'Nonaktifkan' : 'Aktifkan', icon: Power, destructive: h.is_active, separated: true, onSelect: () => setTarget(h) },
                                            ]}
                                        />
                                    </TableCell>
                                </LinkRow>
                            ))}
                            {households.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                                        Tidak ada keluarga yang cocok.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Pagination links={households.links} />
            </div>

            <ConfirmDialog
                open={target !== null}
                onOpenChange={(o) => !o && setTarget(null)}
                title={target?.is_active ? `Nonaktifkan keluarga ${target?.name}?` : `Aktifkan keluarga ${target?.name}?`}
                description={target?.is_active ? 'Keluarga ini tidak muncul lagi sebagai pilihan baru. Anggota dan datanya tetap tersimpan.' : 'Keluarga ini tersedia kembali sebagai pilihan.'}
                confirmLabel={target?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                destructive={target?.is_active}
                onConfirm={() => target && router.patch(route('admin.households.toggle', target.id), {}, { preserveScroll: true, onFinish: () => setTarget(null) })}
            />
        </AppLayout>
    );
}
