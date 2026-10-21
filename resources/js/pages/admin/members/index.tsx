import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type Option, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, LoaderCircle, Pencil, Power } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MemberRow {
    id: number;
    member_number: string | null;
    name: string;
    gender: 'L' | 'P' | null;
    age: number | null;
    phone: string | null;
    household: { id: number; name: string } | null;
    wilayah: string | null;
    status: { value: string; label: string } | null;
    is_active: boolean;
}

interface Filters {
    search: string;
    status: string;
    wilayah: string;
    gender: string;
    aktif: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Data Jemaat', href: '/admin/members' }];
const ALL = '__all__';

export default function MembersIndex({
    members,
    filters,
    statusOptions,
    wilayahOptions,
    totals,
}: {
    members: Paginated<MemberRow>;
    filters: Filters;
    statusOptions: Option[];
    wilayahOptions: Option[];
    totals: { all: number; active: number };
}) {
    const [values, setValues] = useState<Filters>({
        search: filters.search ?? '',
        status: filters.status ?? '',
        wilayah: filters.wilayah ?? '',
        gender: filters.gender ?? '',
        aktif: filters.aktif ?? '',
    });
    const [loading, setLoading] = useState(false);
    const [target, setTarget] = useState<MemberRow | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const apply = (next: Filters) => {
        const params = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== ''));
        router.get(route('admin.members.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    };

    const change = (key: keyof Filters, value: string) => {
        const next = { ...values, [key]: value };
        setValues(next);
        if (timer.current) clearTimeout(timer.current);
        if (key === 'search') {
            timer.current = setTimeout(() => apply(next), 350);
        } else {
            apply(next);
        }
    };

    const reset = () => {
        const empty: Filters = { search: '', status: '', wilayah: '', gender: '', aktif: '' };
        if (timer.current) clearTimeout(timer.current);
        setValues(empty);
        apply(empty);
    };

    const hasFilters = Object.values(values).some((v) => v !== '');
    const sel = (v: string) => (v === '' ? ALL : v);
    const unsel = (v: string) => (v === ALL ? '' : v);

    const toggle = () => {
        if (!target) return;
        router.patch(route('admin.members.toggle', target.id), {}, { preserveScroll: true, onFinish: () => setTarget(null) });
    };

    const statusClass = (value?: string) => (value === 'pindah' || value === 'meninggal' ? 'text-muted-foreground' : value === 'tetap' ? 'text-foreground' : '');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Jemaat" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Data Jemaat"
                    description={`${totals.all} jemaat terdaftar, ${totals.active} di antaranya aktif.`}
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={route('admin.households.index')}>Keluarga</Link>
                            </Button>
                            <Button asChild>
                                <Link href={route('admin.members.create')}>Tambah jemaat</Link>
                            </Button>
                        </>
                    }
                />

                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        type="search"
                        value={values.search}
                        onChange={(e) => change('search', e.target.value)}
                        placeholder="Cari nama, nomor jemaat, telepon, atau NIK"
                        aria-label="Cari jemaat"
                        className="w-full sm:w-80"
                    />
                    <Select value={sel(values.status)} onValueChange={(v) => change('status', unsel(v))}>
                        <SelectTrigger className="w-full sm:w-44" aria-label="Status keanggotaan">
                            <SelectValue placeholder="Status keanggotaan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Semua status</SelectItem>
                            {statusOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sel(values.wilayah)} onValueChange={(v) => change('wilayah', unsel(v))}>
                        <SelectTrigger className="w-full sm:w-44" aria-label="Wilayah">
                            <SelectValue placeholder="Wilayah" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Semua wilayah</SelectItem>
                            {wilayahOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sel(values.gender)} onValueChange={(v) => change('gender', unsel(v))}>
                        <SelectTrigger className="w-full sm:w-44" aria-label="Jenis kelamin">
                            <SelectValue placeholder="Jenis kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Semua jenis kelamin</SelectItem>
                            <SelectItem value="L">Laki-laki</SelectItem>
                            <SelectItem value="P">Perempuan</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sel(values.aktif)} onValueChange={(v) => change('aktif', unsel(v))}>
                        <SelectTrigger className="w-full sm:w-40" aria-label="Keaktifan">
                            <SelectValue placeholder="Keaktifan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Semua keaktifan</SelectItem>
                            <SelectItem value="1">Aktif</SelectItem>
                            <SelectItem value="0">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                    {hasFilters && (
                        <Button type="button" variant="ghost" onClick={reset}>
                            Atur ulang
                        </Button>
                    )}
                    {loading && (
                        <span className="text-muted-foreground flex items-center gap-2 text-sm" role="status">
                            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                            Memuat…
                        </span>
                    )}
                </div>

                {members.data.length === 0 ? (
                    <p className={cn('text-muted-foreground py-10 text-center text-sm transition-opacity', loading && 'opacity-60')}>
                        {hasFilters ? 'Tidak ada jemaat yang cocok dengan filter ini.' : 'Belum ada data jemaat.'}
                    </p>
                ) : (
                    <div className={cn('transition-opacity', loading && 'opacity-60')}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Keluarga</TableHead>
                                    <TableHead>Wilayah</TableHead>
                                    <TableHead>Umur</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-12">
                                        <span className="sr-only">Aksi</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.data.map((m) => (
                                    <LinkRow key={m.id} href={route('admin.members.show', m.id)} className={cn(!m.is_active && 'text-muted-foreground')}>
                                        <TableCell>
                                            <div className={cn('font-medium', m.is_active && 'text-foreground')}>{m.name}</div>
                                            {m.member_number && <div className="text-muted-foreground text-sm">{m.member_number}</div>}
                                        </TableCell>
                                        <TableCell>{m.household?.name ?? '-'}</TableCell>
                                        <TableCell>{m.wilayah ?? '-'}</TableCell>
                                        <TableCell className="tabular-nums">{m.age !== null ? `${m.age} th` : '-'}</TableCell>
                                        <TableCell>{m.phone ?? '-'}</TableCell>
                                        <TableCell>
                                            {m.status ? (
                                                <Badge variant="outline" className={statusClass(m.status.value)}>
                                                    {m.status.label}
                                                </Badge>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <RowActions
                                                actions={[
                                                    { label: 'Lihat detail', icon: Eye, href: route('admin.members.show', m.id) },
                                                    { label: 'Ubah', icon: Pencil, href: route('admin.members.edit', m.id) },
                                                    { label: m.is_active ? 'Nonaktifkan' : 'Aktifkan', icon: Power, onSelect: () => setTarget(m), separated: true },
                                                ]}
                                            />
                                        </TableCell>
                                    </LinkRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <Pagination links={members.links} />
            </div>

            <ConfirmDialog
                open={target !== null}
                onOpenChange={(open) => !open && setTarget(null)}
                title={target?.is_active ? `Nonaktifkan ${target?.name}?` : `Aktifkan ${target?.name}?`}
                description={
                    target?.is_active
                        ? 'Jemaat ini tidak lagi dihitung sebagai jemaat aktif, tetapi seluruh data dan riwayat pemberiannya tetap tersimpan. Anda bisa mengaktifkannya kembali kapan saja.'
                        : 'Jemaat ini akan kembali dihitung sebagai jemaat aktif dan muncul di daftar pilihan jemaat.'
                }
                confirmLabel={target?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                onConfirm={toggle}
            />
        </AppLayout>
    );
}
