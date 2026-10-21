import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { DefinitionList, DetailCard } from '@/components/app/detail';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, Pencil, Plus, UserMinus } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';

type Opt = { value: string; label: string };

interface Household {
    id: number;
    name: string;
    family_number: string | null;
    address: string | null;
    rt_rw: string | null;
    kelurahan: string | null;
    kecamatan: string | null;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    notes: string | null;
    is_active: boolean;
    housing_status: Opt | null;
    full_address: string | null;
}

interface MemberRow {
    id: number;
    member_number: string | null;
    name: string;
    gender: 'L' | 'P' | null;
    age: number | null;
    family_role: Opt | null;
    status: Opt | null;
    is_active: boolean;
}

interface Props {
    household: Household;
    members: MemberRow[];
    availableMembers: Array<{ id: number; name: string; member_number: string | null }>;
    familyRoles: Opt[];
}

export default function HouseholdShow({ household, members, availableMembers, familyRoles }: Props) {
    const [attachOpen, setAttachOpen] = useState(false);
    const [detaching, setDetaching] = useState<MemberRow | null>(null);
    const form = useForm({ member_id: '', family_role: '' });
    const newMemberUrl = route('admin.members.create', { household_id: household.id });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Keluarga', href: route('admin.households.index') },
        { title: household.name, href: '#' },
    ];

    const close = () => {
        setAttachOpen(false);
        form.reset();
        form.clearErrors();
    };
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.households.members.attach', household.id), { preserveScroll: true, onSuccess: close });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={household.name} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title={household.name}
                    description={household.family_number ? `Nomor keluarga ${household.family_number}` : undefined}
                    actions={
                        <>
                            {!household.is_active && <StatusBadge active={false} />}
                            <Button asChild>
                                <Link href={route('admin.households.edit', household.id)}>Ubah</Link>
                            </Button>
                        </>
                    }
                />

                <DetailCard title="Alamat dan kontak">
                    <DefinitionList
                        columns={3}
                        items={[
                            { label: 'Alamat lengkap', value: household.full_address ?? household.address },
                            { label: 'Telepon', value: household.phone },
                            { label: 'Status tempat tinggal', value: household.housing_status?.label },
                            { label: 'RT/RW', value: household.rt_rw },
                            { label: 'Kelurahan', value: household.kelurahan },
                            { label: 'Kecamatan', value: household.kecamatan },
                            { label: 'Kota', value: household.city },
                            { label: 'Kode pos', value: household.postal_code },
                            { label: 'Catatan', value: household.notes },
                        ]}
                    />
                </DetailCard>

                <DetailCard
                    title="Anggota keluarga"
                    description={`${members.length} jemaat`}
                    flush
                    actions={
                        <>
                            <Button asChild variant="outline" size="sm">
                                <Link href={newMemberUrl}>Jemaat baru</Link>
                            </Button>
                            <Button size="sm" onClick={() => setAttachOpen(true)}>
                                <Plus className="size-4" />
                                Tambah anggota
                            </Button>
                        </>
                    }
                >
                    {members.length === 0 ? (
                        <p className="text-muted-foreground px-5 py-6 text-sm md:px-6">Belum ada anggota di keluarga ini.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Status dalam keluarga</TableHead>
                                    <TableHead>Umur</TableHead>
                                    <TableHead>Status keanggotaan</TableHead>
                                    <TableHead className="w-12">
                                        <span className="sr-only">Aksi</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((m) => (
                                    <LinkRow key={m.id} href={route('admin.members.show', m.id)}>
                                        <TableCell>
                                            <span className="font-medium">{m.name}</span>
                                            {m.member_number && <span className="text-muted-foreground block text-xs">{m.member_number}</span>}
                                        </TableCell>
                                        <TableCell>{m.family_role?.label ?? '-'}</TableCell>
                                        <TableCell className="tabular-nums">{m.age !== null ? `${m.age} tahun` : '-'}</TableCell>
                                        <TableCell>{m.status?.label ?? '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <RowActions
                                                actions={[
                                                    { label: 'Lihat detail', icon: Eye, href: route('admin.members.show', m.id) },
                                                    { label: 'Ubah', icon: Pencil, href: route('admin.members.edit', m.id) },
                                                    { label: 'Keluarkan dari keluarga', icon: UserMinus, destructive: true, separated: true, onSelect: () => setDetaching(m) },
                                                ]}
                                            />
                                        </TableCell>
                                    </LinkRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DetailCard>
            </div>

            <Dialog open={attachOpen} onOpenChange={(o) => !o && close()}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>Tambah anggota</DialogTitle>
                            <DialogDescription>Pilih jemaat yang belum memiliki keluarga.</DialogDescription>
                        </DialogHeader>
                        {availableMembers.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Semua jemaat sudah tergabung dalam keluarga.{' '}
                                <Link href={newMemberUrl} className="text-foreground underline underline-offset-4">
                                    Tambah jemaat baru
                                </Link>
                            </p>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Jemaat</Label>
                                    <Select value={form.data.member_id} onValueChange={(v) => form.setData('member_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jemaat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableMembers.map((m) => (
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
                                    <Label>Status dalam keluarga</Label>
                                    <Select value={form.data.family_role} onValueChange={(v) => form.setData('family_role', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {familyRoles.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.family_role} />
                                </div>
                            </>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={close}>
                                Batal
                            </Button>
                            {availableMembers.length > 0 && (
                                <Button type="submit" disabled={form.processing || !form.data.member_id || !form.data.family_role}>
                                    Tambahkan
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={detaching !== null}
                onOpenChange={(o) => !o && setDetaching(null)}
                title={`Keluarkan ${detaching?.name ?? ''} dari keluarga?`}
                description="Jemaat tidak dihapus. Ia hanya tidak lagi terhubung ke keluarga ini dan bisa dimasukkan ke keluarga lain."
                confirmLabel="Keluarkan"
                destructive
                onConfirm={() => detaching && router.delete(route('admin.households.members.detach', [household.id, detaching.id]), { preserveScroll: true, onFinish: () => setDetaching(null) })}
            />
        </AppLayout>
    );
}
