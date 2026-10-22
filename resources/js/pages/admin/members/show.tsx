import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import InputError from '@/components/input-error';
import { BackIconButton } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime } from '@/lib/date';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { type AttributeDefinition } from '@/types/attributes';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEventHandler, useEffect, useState } from 'react';

type Opt = { value: string; label: string };
type OptOrNull = Opt | null;

interface Member {
    id: number;
    member_number: string | null;
    nik: string | null;
    nik_masked: string | null;
    name: string;
    gender: 'L' | 'P' | null;
    place_of_birth: string | null;
    occupation: string | null;
    father_name: string | null;
    mother_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    ktp_address: string | null;
    previous_church: string | null;
    emergency_name: string | null;
    emergency_phone: string | null;
    emergency_relation: string | null;
    notes: string | null;
    is_active: boolean;
    birth_date: string | null;
    age: number | null;
    membership_date: string | null;
    marital_status: OptOrNull;
    education: OptOrNull;
    family_role: OptOrNull;
    membership_status: OptOrNull;
    wilayah: { value: string; label: string; id: number } | null;
    has_photo: boolean;
    photo_version: string | number | null;
    user: { id: number; name: string; email: string } | null;
    created_at: string;
}

interface Household {
    id: number;
    name: string;
    family_number: string | null;
    address: string | null;
    wilayah: string | null;
    members: Array<{ id: number; name: string; age: number | null; family_role: OptOrNull; status: OptOrNull; is_self: boolean }>;
}

interface Milestone {
    id: number;
    type: string;
    type_label: string;
    date: string | null;
    church: string | null;
    minister: string | null;
    certificate_number: string | null;
    civil_number: string | null;
    notes: string | null;
}

interface Ministry {
    id: number;
    ministry: string;
    ministry_label: string;
    role_title: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    notes: string | null;
}

interface Doc {
    id: number;
    type: string;
    type_label: string;
    title: string | null;
    document_number: string | null;
    issued_date: string | null;
    original_name: string;
    mime: string;
    size: number;
    uploaded_by: string | null;
    created_at: string;
}

interface Giving {
    year: number;
    total_year: number;
    total_all: number;
    count: number;
    recent: Array<{ id: number; date: string; category: string | null; amount: number; receipt_number: string | null }>;
}

interface Props {
    member: Member;
    household: Household | null;
    milestones: Milestone[];
    ministries: Ministry[];
    documents: Doc[];
    giving: Giving;
    customFields: { definitions: AttributeDefinition[]; values: Record<string, any> };
    lookups: { milestoneTypes: Opt[]; ministries: Opt[]; documentTypes: Opt[] };
}

const TABS = ['profil', 'keluarga', 'kerohanian', 'dokumen', 'persembahan'];
const today = () => new Date().toISOString().slice(0, 10);

function formatSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function customValue(def: AttributeDefinition, value: any) {
    if (value === null || value === undefined || value === '') return null;
    if (def.data_type === 'boolean') return value ? 'Ya' : 'Tidak';
    if (def.data_type === 'date') return formatDate(String(value));
    return String(value);
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
    return <p className="text-muted-foreground px-5 py-6 text-sm md:px-6">{children}</p>;
}

export default function MemberShow({ member, household, milestones, ministries, documents, giving, customFields, lookups }: Props) {
    const getInitials = useInitials();
    const [tab, setTab] = useState('profil');

    useEffect(() => {
        const h = window.location.hash.replace('#', '');
        if (TABS.includes(h)) setTab(h);
    }, []);

    const changeTab = (value: string) => {
        setTab(value);
        window.history.replaceState(null, '', `#${value}`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Data Jemaat', href: route('admin.members.index') },
        { title: member.name, href: '#' },
    ];

    // Milestones
    const [msDialog, setMsDialog] = useState<{ item: Milestone | null } | null>(null);
    const [msDelete, setMsDelete] = useState<Milestone | null>(null);
    const msForm = useForm({ type: '', date: '', church: '', minister: '', certificate_number: '', civil_number: '', notes: '' });

    const openMilestone = (item: Milestone | null) => {
        msForm.clearErrors();
        msForm.setData({
            type: item?.type ?? '',
            date: item?.date ?? '',
            church: item?.church ?? '',
            minister: item?.minister ?? '',
            certificate_number: item?.certificate_number ?? '',
            civil_number: item?.civil_number ?? '',
            notes: item?.notes ?? '',
        });
        setMsDialog({ item });
    };
    const closeMilestone = () => {
        setMsDialog(null);
        msForm.reset();
        msForm.clearErrors();
    };
    const submitMilestone: FormEventHandler = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeMilestone };
        if (msDialog?.item) msForm.put(route('admin.members.milestones.update', [member.id, msDialog.item.id]), opts);
        else msForm.post(route('admin.members.milestones.store', member.id), opts);
    };

    // Ministries
    const [mnDialog, setMnDialog] = useState<{ item: Ministry | null } | null>(null);
    const [mnDelete, setMnDelete] = useState<Ministry | null>(null);
    const mnForm = useForm({ ministry: '', role_title: '', start_date: '', end_date: '', notes: '' });

    const openMinistry = (item: Ministry | null) => {
        mnForm.clearErrors();
        mnForm.setData({
            ministry: item?.ministry ?? '',
            role_title: item?.role_title ?? '',
            start_date: item?.start_date ?? '',
            end_date: item?.end_date ?? '',
            notes: item?.notes ?? '',
        });
        setMnDialog({ item });
    };
    const closeMinistry = () => {
        setMnDialog(null);
        mnForm.reset();
        mnForm.clearErrors();
    };
    const submitMinistry: FormEventHandler = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: closeMinistry };
        if (mnDialog?.item) mnForm.put(route('admin.members.ministries.update', [member.id, mnDialog.item.id]), opts);
        else mnForm.post(route('admin.members.ministries.store', member.id), opts);
    };

    // Documents
    const [docOpen, setDocOpen] = useState(false);
    const [docDelete, setDocDelete] = useState<Doc | null>(null);
    const docForm = useForm<{ type: string; title: string; document_number: string; issued_date: string; notes: string; file: File | null }>({
        type: '',
        title: '',
        document_number: '',
        issued_date: '',
        notes: '',
        file: null,
    });
    const closeDoc = () => {
        setDocOpen(false);
        docForm.reset();
        docForm.clearErrors();
    };
    const submitDoc: FormEventHandler = (e) => {
        e.preventDefault();
        docForm.post(route('admin.members.documents.store', member.id), { forceFormData: true, preserveScroll: true, onSuccess: closeDoc });
    };

    const hasEmergency = member.emergency_name || member.emergency_phone || member.emergency_relation;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={member.name} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <BackIconButton href={route('admin.members.index')} />
                        {member.has_photo ? (
                            <img src={route('admin.members.photo', member.id) + '?v=' + member.photo_version} alt={member.name} className="size-16 shrink-0 rounded-full object-cover" />
                        ) : (
                            <div className="bg-muted text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-full text-lg font-medium" aria-hidden="true">
                                {getInitials(member.name)}
                            </div>
                        )}
                        <div className="min-w-0 space-y-1">
                            <h1 className="truncate text-2xl font-semibold tracking-tight">{member.name}</h1>
                            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                <span>{[member.member_number, member.wilayah?.label].filter(Boolean).join(' · ') || 'Belum ada nomor jemaat'}</span>
                                {member.membership_status && <Badge variant="outline">{member.membership_status.label}</Badge>}
                                {!member.is_active && <span>Nonaktif</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button asChild>
                            <Link href={route('admin.members.edit', member.id)}>Ubah</Link>
                        </Button>
                        {household && (
                            <Button asChild variant="outline">
                                <Link href={route('admin.households.show', household.id)}>Keluarga</Link>
                            </Button>
                        )}
                    </div>
                </div>

                <StatTiles
                    items={[
                        { label: 'Umur', value: member.age !== null ? `${member.age} tahun` : '-' },
                        { label: 'Status keanggotaan', value: member.membership_status?.label ?? '-' },
                        { label: 'Anggota sejak', value: formatDate(member.membership_date) },
                        { label: `Persembahan ${giving.year}`, value: formatRupiah(giving.total_year), tone: giving.total_year > 0 ? 'income' : undefined },
                    ]}
                />

                <Tabs value={tab} onValueChange={changeTab} className="space-y-6">
                    <div className="overflow-x-auto">
                        <TabsList className="w-max">
                            <TabsTrigger value="profil">Profil</TabsTrigger>
                            <TabsTrigger value="keluarga">Keluarga</TabsTrigger>
                            <TabsTrigger value="kerohanian">Kerohanian</TabsTrigger>
                            <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
                            <TabsTrigger value="persembahan">Persembahan</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="profil" className="mt-0 space-y-6">
                        <DetailCard title="Identitas">
                            <DefinitionList
                                columns={3}
                                items={[
                                    { label: 'NIK', value: member.nik_masked },
                                    {
                                        label: 'Tempat dan tanggal lahir',
                                        value: member.birth_date || member.place_of_birth ? `${[member.place_of_birth, member.birth_date ? formatDate(member.birth_date) : null].filter(Boolean).join(', ')}${member.age !== null ? ` (${member.age} tahun)` : ''}` : null,
                                    },
                                    { label: 'Jenis kelamin', value: member.gender === 'L' ? 'Laki-laki' : member.gender === 'P' ? 'Perempuan' : null },
                                    { label: 'Status pernikahan', value: member.marital_status?.label },
                                    { label: 'Pendidikan', value: member.education?.label },
                                    { label: 'Pekerjaan', value: member.occupation },
                                    { label: 'Nama ayah', value: member.father_name },
                                    { label: 'Nama ibu', value: member.mother_name },
                                ]}
                            />
                        </DetailCard>
                        <DetailCard title="Kontak dan alamat">
                            <DefinitionList
                                items={[
                                    { label: 'Telepon', value: member.phone },
                                    { label: 'Email', value: member.email },
                                    { label: 'Alamat domisili', value: member.address },
                                    { label: 'Alamat KTP', value: member.ktp_address },
                                ]}
                            />
                        </DetailCard>
                        {hasEmergency && (
                            <DetailCard title="Kontak darurat">
                                <DefinitionList
                                    columns={3}
                                    items={[
                                        { label: 'Nama', value: member.emergency_name },
                                        { label: 'Telepon', value: member.emergency_phone },
                                        { label: 'Hubungan', value: member.emergency_relation },
                                    ]}
                                />
                            </DetailCard>
                        )}
                        {member.notes && (
                            <DetailCard title="Catatan">
                                <p className="text-sm leading-relaxed whitespace-pre-line">{member.notes}</p>
                            </DetailCard>
                        )}
                        {customFields.definitions.length > 0 && (
                            <DetailCard title="Isian tambahan">
                                <DefinitionList columns={3} items={customFields.definitions.map((d) => ({ label: d.label, value: customValue(d, customFields.values[d.key]) }))} />
                            </DetailCard>
                        )}
                        {member.user && (
                            <DetailCard title="Akun pengguna">
                                <DefinitionList
                                    items={[
                                        {
                                            label: 'Nama',
                                            value: (
                                                <Link href={route('admin.users.show', member.user.id)} className="hover:underline">
                                                    {member.user.name}
                                                </Link>
                                            ),
                                        },
                                        { label: 'Email', value: member.user.email },
                                    ]}
                                />
                            </DetailCard>
                        )}
                    </TabsContent>

                    <TabsContent value="keluarga" className="mt-0">
                        {household ? (
                            <DetailCard
                                title={household.name}
                                description={household.family_number ? `Nomor keluarga ${household.family_number}` : undefined}
                                actions={
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.households.show', household.id)}>Buka keluarga</Link>
                                    </Button>
                                }
                                flush
                            >
                                {household.address && <p className="text-muted-foreground px-5 pb-1 text-sm md:px-6">{household.address}</p>}
                                {household.wilayah && <p className="text-muted-foreground px-5 pb-4 text-sm md:px-6">Wilayah: {household.wilayah}</p>}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Status dalam keluarga</TableHead>
                                            <TableHead>Umur</TableHead>
                                            <TableHead>Status keanggotaan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {household.members.map((m) => {
                                            const cells = (
                                                <>
                                                    <TableCell>
                                                        {m.is_self ? (
                                                            <>
                                                                <span className="font-semibold">{m.name}</span>
                                                                <span className="text-muted-foreground ml-2 text-xs">Jemaat ini</span>
                                                            </>
                                                        ) : (
                                                            <Link href={route('admin.members.show', m.id)} className="font-medium hover:underline">
                                                                {m.name}
                                                            </Link>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{m.family_role?.label ?? '-'}</TableCell>
                                                    <TableCell className="tabular-nums">{m.age !== null ? `${m.age} tahun` : '-'}</TableCell>
                                                    <TableCell>{m.status?.label ?? '-'}</TableCell>
                                                </>
                                            );
                                            return m.is_self ? (
                                                <TableRow key={m.id} className="bg-muted/40">
                                                    {cells}
                                                </TableRow>
                                            ) : (
                                                <LinkRow key={m.id} href={route('admin.members.show', m.id)}>
                                                    {cells}
                                                </LinkRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </DetailCard>
                        ) : (
                            <DetailCard title="Keluarga">
                                <div className="flex flex-col items-start gap-3">
                                    <p className="text-muted-foreground text-sm">Jemaat ini belum tergabung dalam keluarga mana pun.</p>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.members.edit', member.id)}>Pilih keluarga</Link>
                                    </Button>
                                </div>
                            </DetailCard>
                        )}
                    </TabsContent>

                    <TabsContent value="kerohanian" className="mt-0 space-y-6">
                        <DetailCard title="Keanggotaan">
                            <DefinitionList
                                columns={3}
                                items={[
                                    { label: 'Status', value: member.membership_status?.label },
                                    { label: 'Tanggal diterima', value: member.membership_date ? formatDate(member.membership_date) : null },
                                    { label: 'Gereja asal', value: member.previous_church },
                                    {
                                        label: 'Wilayah',
                                        value: member.wilayah ? (
                                            <Link href={route('admin.wilayah.show', member.wilayah.id)} className="hover:underline underline-offset-4">
                                                {member.wilayah.label}
                                            </Link>
                                        ) : null,
                                    },
                                ]}
                            />
                        </DetailCard>

                        <DetailCard
                            title="Sakramen dan peristiwa gerejawi"
                            flush
                            actions={
                                <Button size="sm" onClick={() => openMilestone(null)}>
                                    <Plus className="size-4" />
                                    Catat peristiwa
                                </Button>
                            }
                        >
                            {milestones.length === 0 ? (
                                <EmptyLine>Belum ada peristiwa yang dicatat.</EmptyLine>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Jenis</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Gereja</TableHead>
                                            <TableHead>Pendeta</TableHead>
                                            <TableHead>Nomor surat</TableHead>
                                            <TableHead>Nomor akta sipil</TableHead>
                                            <TableHead className="w-12">
                                                <span className="sr-only">Aksi</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {milestones.map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell className="font-medium">{m.type_label}</TableCell>
                                                <TableCell>{formatDate(m.date)}</TableCell>
                                                <TableCell>{m.church ?? '-'}</TableCell>
                                                <TableCell>{m.minister ?? '-'}</TableCell>
                                                <TableCell>{m.certificate_number ?? '-'}</TableCell>
                                                <TableCell>{m.civil_number ?? '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <RowActions
                                                        actions={[
                                                            { label: 'Ubah', icon: Pencil, onSelect: () => openMilestone(m) },
                                                            { label: 'Hapus', icon: Trash2, destructive: true, separated: true, onSelect: () => setMsDelete(m) },
                                                        ]}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </DetailCard>

                        <DetailCard
                            title="Pelayanan dan jabatan"
                            flush
                            actions={
                                <Button size="sm" onClick={() => openMinistry(null)}>
                                    <Plus className="size-4" />
                                    Tambah pelayanan
                                </Button>
                            }
                        >
                            {ministries.length === 0 ? (
                                <EmptyLine>Belum ada riwayat pelayanan.</EmptyLine>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Pelayanan</TableHead>
                                            <TableHead>Jabatan</TableHead>
                                            <TableHead>Mulai</TableHead>
                                            <TableHead>Selesai</TableHead>
                                            <TableHead className="w-12">
                                                <span className="sr-only">Aksi</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ministries.map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell className="font-medium">{m.ministry_label}</TableCell>
                                                <TableCell>{m.role_title ?? '-'}</TableCell>
                                                <TableCell>{formatDate(m.start_date)}</TableCell>
                                                <TableCell>{m.is_current ? <Badge variant="outline">Masih aktif</Badge> : formatDate(m.end_date)}</TableCell>
                                                <TableCell className="text-right">
                                                    <RowActions
                                                        actions={[
                                                            { label: 'Ubah', icon: Pencil, onSelect: () => openMinistry(m) },
                                                            { label: 'Hapus', icon: Trash2, destructive: true, separated: true, onSelect: () => setMnDelete(m) },
                                                        ]}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </DetailCard>
                    </TabsContent>

                    <TabsContent value="dokumen" className="mt-0">
                        <DetailCard
                            title="Dokumen"
                            description="PDF, JPG, PNG, atau WebP, maksimal 5 MB."
                            flush
                            actions={
                                <Button size="sm" onClick={() => setDocOpen(true)}>
                                    <Plus className="size-4" />
                                    Unggah dokumen
                                </Button>
                            }
                        >
                            {documents.length === 0 ? (
                                <EmptyLine>Belum ada dokumen yang diunggah.</EmptyLine>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Jenis</TableHead>
                                            <TableHead>Judul</TableHead>
                                            <TableHead>Nomor</TableHead>
                                            <TableHead>Tanggal terbit</TableHead>
                                            <TableHead>Ukuran</TableHead>
                                            <TableHead>Diunggah oleh</TableHead>
                                            <TableHead className="w-12">
                                                <span className="sr-only">Aksi</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {documents.map((d) => (
                                            <TableRow key={d.id}>
                                                <TableCell className="font-medium">{d.type_label}</TableCell>
                                                <TableCell>
                                                    {d.title || d.original_name}
                                                    {d.title && <span className="text-muted-foreground block text-xs">{d.original_name}</span>}
                                                </TableCell>
                                                <TableCell>{d.document_number ?? '-'}</TableCell>
                                                <TableCell>{formatDate(d.issued_date)}</TableCell>
                                                <TableCell className="tabular-nums">{formatSize(d.size)}</TableCell>
                                                <TableCell>
                                                    {d.uploaded_by ?? '-'}
                                                    <span className="text-muted-foreground block text-xs">{formatDate(d.created_at)}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <RowActions
                                                        actions={[
                                                            { label: 'Unduh', icon: Download, onSelect: () => (window.location.href = route('admin.members.documents.download', [member.id, d.id])) },
                                                            { label: 'Hapus', icon: Trash2, destructive: true, separated: true, onSelect: () => setDocDelete(d) },
                                                        ]}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </DetailCard>
                    </TabsContent>

                    <TabsContent value="persembahan" className="mt-0 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: `Tahun ${giving.year}`, value: formatRupiah(giving.total_year) },
                                { label: 'Sepanjang waktu', value: formatRupiah(giving.total_all) },
                                { label: 'Jumlah pencatatan', value: String(giving.count) },
                            ].map((s) => (
                                <div key={s.label} className="bg-card rounded-xl border p-5">
                                    <p className="text-muted-foreground text-sm">{s.label}</p>
                                    <p className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums">{s.value}</p>
                                </div>
                            ))}
                        </div>
                        <DetailCard title="Persembahan terbaru" description="Hanya persembahan atas nama yang tercatat di sini." flush>
                            {giving.recent.length === 0 ? (
                                <EmptyLine>Belum ada persembahan atas nama jemaat ini.</EmptyLine>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead>Nomor tanda terima</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {giving.recent.map((g) => (
                                            <LinkRow key={g.id} href={route('donations.show', g.id)}>
                                                <TableCell>{formatDate(g.date)}</TableCell>
                                                <TableCell>{g.category ?? '-'}</TableCell>
                                                <TableCell>{g.receipt_number ?? '-'}</TableCell>
                                                <TableCell className="text-right tabular-nums">{formatRupiah(g.amount)}</TableCell>
                                            </LinkRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </DetailCard>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Milestone dialog */}
            <Dialog open={msDialog !== null} onOpenChange={(o) => !o && closeMilestone()}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <form onSubmit={submitMilestone} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{msDialog?.item ? 'Ubah peristiwa' : 'Catat peristiwa'}</DialogTitle>
                            <DialogDescription>Sidi mengubah status anak menjadi anggota tetap. Atestasi keluar menandai jemaat sebagai pindah dan menonaktifkannya.</DialogDescription>
                        </DialogHeader>
                        <Field label="Jenis peristiwa" error={msForm.errors.type}>
                            <Select value={msForm.data.type} onValueChange={(v) => msForm.setData('type', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lookups.milestoneTypes.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Tanggal" error={msForm.errors.date}>
                            <DatePicker value={msForm.data.date} onChange={(v) => msForm.setData('date', v)} max={today()} required />
                        </Field>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Gereja" error={msForm.errors.church}>
                                <Input value={msForm.data.church} onChange={(e) => msForm.setData('church', e.target.value)} />
                            </Field>
                            <Field label="Pendeta" error={msForm.errors.minister}>
                                <Input value={msForm.data.minister} onChange={(e) => msForm.setData('minister', e.target.value)} />
                            </Field>
                            <Field label="Nomor surat" error={msForm.errors.certificate_number}>
                                <Input value={msForm.data.certificate_number} onChange={(e) => msForm.setData('certificate_number', e.target.value)} />
                            </Field>
                            {msForm.data.type === 'pemberkatan_nikah' && (
                                <Field label="Nomor akta sipil" error={msForm.errors.civil_number}>
                                    <Input value={msForm.data.civil_number} onChange={(e) => msForm.setData('civil_number', e.target.value)} />
                                </Field>
                            )}
                        </div>
                        <Field label="Catatan" error={msForm.errors.notes}>
                            <Textarea rows={2} value={msForm.data.notes} onChange={(e) => msForm.setData('notes', e.target.value)} />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeMilestone}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={msForm.processing || !msForm.data.type || !msForm.data.date}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Ministry dialog */}
            <Dialog open={mnDialog !== null} onOpenChange={(o) => !o && closeMinistry()}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <form onSubmit={submitMinistry} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{mnDialog?.item ? 'Ubah pelayanan' : 'Tambah pelayanan'}</DialogTitle>
                            <DialogDescription>Kosongkan tanggal selesai bila masih melayani.</DialogDescription>
                        </DialogHeader>
                        <Field label="Pelayanan" error={mnForm.errors.ministry}>
                            <Select value={mnForm.data.ministry} onValueChange={(v) => mnForm.setData('ministry', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih pelayanan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lookups.ministries.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Jabatan" error={mnForm.errors.role_title}>
                            <Input value={mnForm.data.role_title} onChange={(e) => mnForm.setData('role_title', e.target.value)} placeholder="Contoh: Ketua, Anggota" />
                        </Field>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Mulai" error={mnForm.errors.start_date}>
                                <DatePicker value={mnForm.data.start_date} onChange={(v) => mnForm.setData('start_date', v)} clearable />
                            </Field>
                            <Field label="Selesai" error={mnForm.errors.end_date}>
                                <DatePicker value={mnForm.data.end_date} onChange={(v) => mnForm.setData('end_date', v)} clearable />
                            </Field>
                        </div>
                        <Field label="Catatan" error={mnForm.errors.notes}>
                            <Textarea rows={2} value={mnForm.data.notes} onChange={(e) => mnForm.setData('notes', e.target.value)} />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeMinistry}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={mnForm.processing || !mnForm.data.ministry}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Document dialog */}
            <Dialog open={docOpen} onOpenChange={(o) => !o && closeDoc()}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <form onSubmit={submitDoc} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>Unggah dokumen</DialogTitle>
                            <DialogDescription>PDF, JPG, PNG, atau WebP, maksimal 5 MB.</DialogDescription>
                        </DialogHeader>
                        <Field label="Jenis dokumen" error={docForm.errors.type}>
                            <Select value={docForm.data.type} onValueChange={(v) => docForm.setData('type', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lookups.documentTypes.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Judul" error={docForm.errors.title}>
                            <Input value={docForm.data.title} onChange={(e) => docForm.setData('title', e.target.value)} />
                        </Field>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Nomor dokumen" error={docForm.errors.document_number}>
                                <Input value={docForm.data.document_number} onChange={(e) => docForm.setData('document_number', e.target.value)} />
                            </Field>
                            <Field label="Tanggal terbit" error={docForm.errors.issued_date}>
                                <DatePicker value={docForm.data.issued_date} onChange={(v) => docForm.setData('issued_date', v)} clearable />
                            </Field>
                        </div>
                        <Field label="Catatan" error={docForm.errors.notes}>
                            <Textarea rows={2} value={docForm.data.notes} onChange={(e) => docForm.setData('notes', e.target.value)} />
                        </Field>
                        <Field label="Berkas" error={docForm.errors.file}>
                            <div className="flex items-center gap-3">
                                <Button type="button" variant="outline" asChild>
                                    <label htmlFor="member-doc-file" className="cursor-pointer">
                                        Pilih berkas
                                    </label>
                                </Button>
                                <span className="text-muted-foreground min-w-0 truncate text-sm">{docForm.data.file ? `${docForm.data.file.name} (${formatSize(docForm.data.file.size)})` : 'Belum ada berkas dipilih'}</span>
                                <input id="member-doc-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={(e) => docForm.setData('file', e.target.files?.[0] ?? null)} />
                            </div>
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDoc}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={docForm.processing || !docForm.data.type || !docForm.data.file}>
                                Unggah
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={msDelete !== null}
                onOpenChange={(o) => !o && setMsDelete(null)}
                title="Hapus peristiwa ini?"
                description={`Catatan ${msDelete?.type_label ?? ''} akan dihapus permanen dan tidak bisa dikembalikan.`}
                confirmLabel="Hapus"
                destructive
                onConfirm={() => msDelete && router.delete(route('admin.members.milestones.destroy', [member.id, msDelete.id]), { preserveScroll: true, onFinish: () => setMsDelete(null) })}
            />
            <ConfirmDialog
                open={mnDelete !== null}
                onOpenChange={(o) => !o && setMnDelete(null)}
                title="Hapus riwayat pelayanan?"
                description={`Catatan pelayanan ${mnDelete?.ministry_label ?? ''} akan dihapus permanen dan tidak bisa dikembalikan.`}
                confirmLabel="Hapus"
                destructive
                onConfirm={() => mnDelete && router.delete(route('admin.members.ministries.destroy', [member.id, mnDelete.id]), { preserveScroll: true, onFinish: () => setMnDelete(null) })}
            />
            <ConfirmDialog
                open={docDelete !== null}
                onOpenChange={(o) => !o && setDocDelete(null)}
                title="Hapus dokumen ini?"
                description={`Berkas ${docDelete?.original_name ?? ''} dihapus permanen dan tidak bisa dikembalikan.`}
                confirmLabel="Hapus"
                destructive
                onConfirm={() => docDelete && router.delete(route('admin.members.documents.destroy', [member.id, docDelete.id]), { preserveScroll: true, onFinish: () => setDocDelete(null) })}
            />
        </AppLayout>
    );
}
