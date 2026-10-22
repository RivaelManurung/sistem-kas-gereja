import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';

interface Officer {
    id: number;
    member_id: number;
    member_name: string;
    member_number: string | null;
    phone: string | null;
    role: string;
    role_label: string;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    notes: string | null;
}

interface Props {
    wilayah: { id: number; name: string; code: string | null; description: string | null; coverage: string | null; meeting_info: string | null; is_active: boolean };
    stats: { households: number; members: number; active_members: number };
    officers: Officer[];
    households: Array<{ id: number; name: string; family_number: string | null; head: string | null; members_count: number; address: string | null; is_active: boolean }>;
    memberOptions: Array<{ id: number; name: string; member_number: string | null }>;
    roleOptions: Array<{ value: string; label: string }>;
}

export default function WilayahShow({ wilayah, stats, officers, households, memberOptions, roleOptions }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Officer | null>(null);
    const [removing, setRemoving] = useState<Officer | null>(null);
    const form = useForm({ member_id: '', role: '', start_date: '', end_date: '', notes: '' });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wilayah', href: route('admin.wilayah.index') },
        { title: wilayah.name, href: '#' },
    ];

    const openDialog = (officer: Officer | null) => {
        setEditing(officer);
        form.clearErrors();
        form.setData({
            member_id: officer ? String(officer.member_id) : '',
            role: officer?.role ?? '',
            start_date: officer?.start_date?.slice(0, 10) ?? '',
            end_date: officer?.end_date?.slice(0, 10) ?? '',
            notes: officer?.notes ?? '',
        });
        setDialogOpen(true);
    };
    const close = () => {
        setDialogOpen(false);
        setEditing(null);
        form.reset();
        form.clearErrors();
    };
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: close };
        if (editing) form.put(route('admin.wilayah.officers.update', [wilayah.id, editing.id]), opts);
        else form.post(route('admin.wilayah.officers.store', wilayah.id), opts);
    };

    // Keep the current officer selectable even if the member list was filtered server-side.
    const members = editing && !memberOptions.some((m) => m.id === editing.member_id) ? [...memberOptions, { id: editing.member_id, name: editing.member_name, member_number: editing.member_number }] : memberOptions;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={wilayah.name} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('admin.wilayah.index')}
                    title={wilayah.name}
                    description={wilayah.meeting_info || wilayah.description || undefined}
                    actions={
                        <>
                            {!wilayah.is_active && <StatusBadge active={false} />}
                            <Button asChild>
                                <Link href={route('admin.wilayah.edit', wilayah.id)}>Ubah</Link>
                            </Button>
                        </>
                    }
                />

                <StatTiles
                    items={[
                        { label: 'Keluarga', value: stats.households },
                        { label: 'Jemaat', value: stats.members },
                        { label: 'Jemaat aktif', value: stats.active_members },
                    ]}
                />

                <DetailCard title="Tentang wilayah">
                    <DefinitionList
                        columns={3}
                        items={[
                            { label: 'Kode', value: wilayah.code },
                            { label: 'Cakupan wilayah', value: wilayah.coverage },
                            { label: 'Jadwal persekutuan', value: wilayah.meeting_info },
                            { label: 'Deskripsi', value: wilayah.description },
                            { label: 'Status', value: <StatusBadge active={wilayah.is_active} /> },
                        ]}
                    />
                </DetailCard>

                <DetailCard
                    title="Pengurus wilayah"
                    description="Penatua, diaken, dan pengurus lain beserta masa jabatannya."
                    flush
                    actions={
                        <Button size="sm" onClick={() => openDialog(null)}>
                            <Plus className="size-4" />
                            Tambah Pengurus
                        </Button>
                    }
                >
                    {officers.length === 0 ? (
                        <p className="text-muted-foreground px-5 py-6 text-sm md:px-6">Belum ada pengurus yang dicatat untuk wilayah ini.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Mulai</TableHead>
                                    <TableHead>Selesai</TableHead>
                                    <TableHead className="w-12">
                                        <span className="sr-only">Aksi</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {officers.map((o) => (
                                    <TableRow key={o.id} className={o.is_current ? undefined : 'text-muted-foreground'}>
                                        <TableCell className={o.is_current ? 'font-medium' : undefined}>{o.role_label}</TableCell>
                                        <TableCell>
                                            <Link href={route('admin.members.show', o.member_id)} className="hover:underline underline-offset-4">
                                                {o.member_name}
                                            </Link>
                                            {o.member_number && <span className="text-muted-foreground block text-xs">{o.member_number}</span>}
                                        </TableCell>
                                        <TableCell>{o.phone ?? '-'}</TableCell>
                                        <TableCell>{o.start_date ? formatDate(o.start_date) : '-'}</TableCell>
                                        <TableCell>{o.is_current ? <Badge variant="outline">Menjabat</Badge> : o.end_date ? formatDate(o.end_date) : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <RowActions
                                                actions={[
                                                    { label: 'Ubah', icon: Pencil, onSelect: () => openDialog(o) },
                                                    { label: 'Hapus', icon: Trash2, destructive: true, separated: true, onSelect: () => setRemoving(o) },
                                                ]}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DetailCard>

                <DetailCard title="Keluarga di wilayah ini" description={`${households.length} keluarga`} flush>
                    {households.length === 0 ? (
                        <p className="text-muted-foreground px-5 py-6 text-sm md:px-6">Belum ada keluarga di wilayah ini. Wilayah sebuah keluarga diatur lewat form data keluarga.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Keluarga</TableHead>
                                    <TableHead>Kepala keluarga</TableHead>
                                    <TableHead>Anggota</TableHead>
                                    <TableHead>Alamat</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {households.map((h) => (
                                    <LinkRow key={h.id} href={route('admin.households.show', h.id)}>
                                        <TableCell>
                                            <span className="font-medium">{h.name}</span>
                                            {h.family_number && <span className="text-muted-foreground block text-xs">{h.family_number}</span>}
                                        </TableCell>
                                        <TableCell>{h.head ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                        <TableCell className="tabular-nums">{h.members_count}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">{h.address ?? '-'}</TableCell>
                                    </LinkRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DetailCard>
            </div>

            <Dialog open={dialogOpen} onOpenChange={(o) => !o && close()}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Ubah pengurus' : 'Tambah pengurus'}</DialogTitle>
                            <DialogDescription>Pilih jemaat dan jabatannya di {wilayah.name}.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="officer_member">Jemaat *</Label>
                            <Select value={form.data.member_id} onValueChange={(v) => form.setData('member_id', v)}>
                                <SelectTrigger id="officer_member">
                                    <SelectValue placeholder="Pilih jemaat" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((m) => (
                                        <SelectItem key={m.id} value={String(m.id)}>
                                            {m.name}
                                            {m.member_number ? ` (${m.member_number})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.member_id} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="officer_role">Jabatan *</Label>
                            <Select value={form.data.role} onValueChange={(v) => form.setData('role', v)}>
                                <SelectTrigger id="officer_role">
                                    <SelectValue placeholder="Pilih jabatan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.role} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="officer_start">Mulai</Label>
                                <DatePicker id="officer_start" value={form.data.start_date} onChange={(v) => form.setData('start_date', v)} clearable />
                                <InputError message={form.errors.start_date} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="officer_end">Selesai</Label>
                                <DatePicker id="officer_end" value={form.data.end_date} onChange={(v) => form.setData('end_date', v)} clearable />
                                <InputError message={form.errors.end_date} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="officer_notes">Catatan</Label>
                            <Textarea id="officer_notes" rows={2} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} />
                            <InputError message={form.errors.notes} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={close}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing || !form.data.member_id || !form.data.role}>
                                {editing ? 'Simpan Perubahan' : 'Tambah Pengurus'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={removing !== null}
                onOpenChange={(o) => !o && setRemoving(null)}
                title={`Hapus ${removing?.member_name ?? ''} dari pengurus?`}
                description={`Catatan jabatan ${removing?.role_label ?? ''} ini dihapus dari riwayat wilayah dan tidak bisa dikembalikan. Data jemaatnya tidak terpengaruh.`}
                confirmLabel="Hapus"
                destructive
                onConfirm={() => removing && router.delete(route('admin.wilayah.officers.destroy', [wilayah.id, removing.id]), { preserveScroll: true, onFinish: () => setRemoving(null) })}
            />
        </AppLayout>
    );
}
