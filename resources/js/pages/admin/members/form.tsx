import { ImageField } from '@/components/app/image-field';
import DynamicFields from '@/components/dynamic-fields';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Option } from '@/types';
import { type CustomFieldsProp } from '@/types/attributes';
import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, ReactNode, useEffect, useState } from 'react';

interface MemberData {
    id: number;
    member_number: string | null;
    nik: string | null;
    name: string;
    gender: 'L' | 'P' | null;
    place_of_birth: string | null;
    marital_status: string | null;
    education: string | null;
    occupation: string | null;
    father_name: string | null;
    mother_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    ktp_address: string | null;
    household_id: number | null;
    family_role: string | null;
    membership_status: string | null;
    previous_church: string | null;
    wilayah: string | null;
    emergency_name: string | null;
    emergency_phone: string | null;
    emergency_relation: string | null;
    notes: string | null;
    user_id: number | null;
    is_active: boolean;
    birth_date: string | null;
    membership_date: string | null;
    has_photo: boolean;
    photo_version: string | number | null;
}

interface Lookups {
    maritalStatus: Option[];
    education: Option[];
    familyRole: Option[];
    membershipStatus: Option[];
    wilayah: Option[];
}

const NONE = '__none__';
const FIELD_ORDER = [
    'photo', 'member_number', 'nik', 'name', 'gender', 'place_of_birth', 'birth_date', 'marital_status', 'education', 'occupation',
    'household_id', 'family_role', 'father_name', 'mother_name',
    'phone', 'email', 'address', 'ktp_address',
    'membership_status', 'membership_date', 'previous_church', 'wilayah', 'user_id', 'is_active',
    'emergency_name', 'emergency_phone', 'emergency_relation', 'notes',
];

function Field({ label, id, error, required, hint, className, children }: { label: string; id: string; error?: string; required?: boolean; hint?: ReactNode; className?: string; children: ReactNode }) {
    return (
        <div className={className ?? 'space-y-2'}>
            <Label htmlFor={id}>
                {label}
                {required && ' *'}
            </Label>
            {children}
            {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

const grid3 = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3';
const grid2 = 'grid grid-cols-1 gap-4 md:grid-cols-2';

export default function MemberForm({
    member,
    users,
    households,
    lookups,
    customFields,
    defaults,
}: {
    member: MemberData | null;
    users: { id: number; name: string; email: string }[];
    households: { id: number; name: string; family_number: string | null }[];
    lookups: Lookups;
    customFields?: CustomFieldsProp;
    defaults?: { household_id: number | null };
}) {
    const isEdit = member !== null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Data Jemaat', href: route('admin.members.index') },
        { title: member ? member.name : 'Tambah jemaat', href: '#' },
    ];

    const s = (v: string | null | undefined) => v ?? '';
    const { data, setData, post, processing, errors, transform } = useForm({
        member_number: s(member?.member_number),
        nik: s(member?.nik),
        name: s(member?.name),
        gender: s(member?.gender),
        place_of_birth: s(member?.place_of_birth),
        birth_date: s(member?.birth_date),
        marital_status: s(member?.marital_status),
        education: s(member?.education),
        occupation: s(member?.occupation),
        father_name: s(member?.father_name),
        mother_name: s(member?.mother_name),
        phone: s(member?.phone),
        email: s(member?.email),
        address: s(member?.address),
        ktp_address: s(member?.ktp_address),
        household_id: member?.household_id ? String(member.household_id) : defaults?.household_id ? String(defaults.household_id) : '',
        family_role: s(member?.family_role),
        membership_status: member?.membership_status ?? 'tetap',
        membership_date: s(member?.membership_date),
        previous_church: s(member?.previous_church),
        wilayah: s(member?.wilayah),
        emergency_name: s(member?.emergency_name),
        emergency_phone: s(member?.emergency_phone),
        emergency_relation: s(member?.emergency_relation),
        notes: s(member?.notes),
        user_id: member?.user_id ? String(member.user_id) : '',
        is_active: member?.is_active ?? true,
        photo: null as File | null,
        remove_photo: false as boolean,
        attributes: (customFields?.values ?? {}) as Record<string, any>,
    });

    const [sameAddress, setSameAddress] = useState<boolean>(isEdit && !!member?.address && member.address === member.ktp_address);
    const today = new Date().toISOString().slice(0, 10);
    const err = errors as Record<string, string>;

    // Fokus ke kolom pertama yang bermasalah setelah simpan gagal.
    useEffect(() => {
        const keys = Object.keys(err);
        if (keys.length === 0) return;
        const normalized = keys.map((k) => (k.startsWith('attributes.') ? `attr_${k.slice('attributes.'.length)}` : k));
        const first = FIELD_ORDER.find((k) => normalized.includes(k)) ?? normalized[0];
        const el = document.getElementById(first);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (el as HTMLElement).focus({ preventScroll: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errors]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((d) => {
            const payload: Record<string, unknown> = { ...d };
            if (!d.photo) delete payload.photo;
            if (isEdit) payload._method = 'PUT';
            return payload as typeof d;
        });
        post(isEdit ? route('admin.members.update', member.id) : route('admin.members.store'), { forceFormData: true, preserveScroll: true });
    };

    const text = (key: keyof typeof data) => ({
        id: key as string,
        value: data[key] as string,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setData(key, e.target.value as never),
    });

    const choice = (key: keyof typeof data, options: Option[], placeholder: string, noneLabel = 'Tidak dipilih') => (
        <Select value={(data[key] as string) || NONE} onValueChange={(v) => setData(key, (v === NONE ? '' : v) as never)}>
            <SelectTrigger id={key as string} aria-invalid={!!err[key as string]}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={NONE}>{noneLabel}</SelectItem>
                {options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const currentPhoto = isEdit && member.has_photo ? `${route('admin.members.photo', member.id)}?v=${member.photo_version ?? ''}` : null;
    const autoInactive = data.membership_status === 'pindah' || data.membership_status === 'meninggal';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? `Ubah ${member.name}` : 'Tambah jemaat'} />
            <form onSubmit={submit} noValidate>
                <div className="space-y-6 p-4 md:p-6 lg:p-8">
                    <PageHeader
                        back={isEdit ? route('admin.members.show', member.id) : route('admin.members.index')}
                        title={isEdit ? `Ubah data ${member.name}` : 'Tambah jemaat'}
                        description={isEdit ? 'Perbarui data lengkap anggota jemaat ini.' : 'Catat data lengkap anggota jemaat baru.'}
                    />

                    <Section title="Foto dan identitas" description="Data pribadi sesuai kartu identitas.">
                        <div className="space-y-6">
                            <ImageField
                                id="photo"
                                label="Foto"
                                hint="PNG, JPG, atau WebP."
                                currentUrl={currentPhoto}
                                file={data.photo}
                                removed={data.remove_photo}
                                previewClassName="size-24"
                                error={err.photo}
                                onFile={(f) => {
                                    setData((d) => ({ ...d, photo: f, remove_photo: false }));
                                }}
                                onRemove={() => setData((d) => ({ ...d, photo: null, remove_photo: true }))}
                            />
                            <div className={grid3}>
                                <Field label="Nomor jemaat" id="member_number" error={err.member_number}>
                                    <Input {...text('member_number')} />
                                </Field>
                                <Field label="NIK" id="nik" error={err.nik}>
                                    <Input
                                        id="nik"
                                        inputMode="numeric"
                                        maxLength={16}
                                        value={data.nik}
                                        onChange={(e) => setData('nik', e.target.value.replace(/\D/g, ''))}
                                    />
                                </Field>
                                <Field label="Nama lengkap" id="name" required error={err.name}>
                                    <Input {...text('name')} />
                                </Field>
                                <Field label="Jenis kelamin" id="gender" error={err.gender}>
                                    <Select value={data.gender || NONE} onValueChange={(v) => setData('gender', v === NONE ? '' : v)}>
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Pilih jenis kelamin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE}>Tidak dipilih</SelectItem>
                                            <SelectItem value="L">Laki-laki</SelectItem>
                                            <SelectItem value="P">Perempuan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Tempat lahir" id="place_of_birth" error={err.place_of_birth}>
                                    <Input {...text('place_of_birth')} />
                                </Field>
                                <Field label="Tanggal lahir" id="birth_date" error={err.birth_date}>
                                    <DatePicker id="birth_date" value={data.birth_date} onChange={(v) => setData('birth_date', v)} max={today} clearable />
                                </Field>
                                <Field label="Status pernikahan" id="marital_status" error={err.marital_status}>
                                    {choice('marital_status', lookups.maritalStatus, 'Pilih status pernikahan')}
                                </Field>
                                <Field label="Pendidikan" id="education" error={err.education}>
                                    {choice('education', lookups.education, 'Pilih pendidikan')}
                                </Field>
                                <Field label="Pekerjaan" id="occupation" error={err.occupation}>
                                    <Input {...text('occupation')} />
                                </Field>
                            </div>
                        </div>
                    </Section>

                    <Section title="Keluarga" description="Keluarga tempat jemaat ini tercatat dan perannya di dalamnya.">
                        <div className={grid3}>
                            <Field
                                label="Keluarga"
                                id="household_id"
                                error={err.household_id}
                                hint={
                                    <Link href={route('admin.households.create')} className="hover:text-foreground underline underline-offset-2">
                                        Buat keluarga baru
                                    </Link>
                                }
                            >
                                <Select value={data.household_id || NONE} onValueChange={(v) => setData('household_id', v === NONE ? '' : v)}>
                                    <SelectTrigger id="household_id">
                                        <SelectValue placeholder="Pilih keluarga" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>Tanpa keluarga</SelectItem>
                                        {households.map((h) => (
                                            <SelectItem key={h.id} value={String(h.id)}>
                                                {h.family_number ? `${h.family_number} · ${h.name}` : h.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Status dalam keluarga" id="family_role" error={err.family_role}>
                                {choice('family_role', lookups.familyRole, 'Pilih status dalam keluarga')}
                            </Field>
                            <div className="hidden xl:block" />
                            <Field label="Nama ayah" id="father_name" error={err.father_name}>
                                <Input {...text('father_name')} />
                            </Field>
                            <Field label="Nama ibu" id="mother_name" error={err.mother_name}>
                                <Input {...text('mother_name')} />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Kontak dan alamat" description="Cara menghubungi dan lokasi tempat tinggal jemaat.">
                        <div className="space-y-4">
                            <div className={grid2}>
                                <Field label="Telepon" id="phone" error={err.phone}>
                                    <Input {...text('phone')} inputMode="tel" />
                                </Field>
                                <Field label="Email" id="email" error={err.email}>
                                    <Input {...text('email')} type="email" />
                                </Field>
                            </div>
                            <div className={grid2}>
                                <Field label="Alamat domisili" id="address" error={err.address}>
                                    <Textarea
                                        id="address"
                                        rows={3}
                                        value={data.address}
                                        onChange={(e) => {
                                            setData((d) => ({ ...d, address: e.target.value, ktp_address: sameAddress ? e.target.value : d.ktp_address }));
                                        }}
                                    />
                                </Field>
                                <Field label="Alamat KTP" id="ktp_address" error={err.ktp_address}>
                                    <Textarea
                                        id="ktp_address"
                                        rows={3}
                                        value={data.ktp_address}
                                        disabled={sameAddress}
                                        onChange={(e) => setData('ktp_address', e.target.value)}
                                    />
                                    <div className="flex items-center gap-2 pt-1">
                                        <Checkbox
                                            id="same_address"
                                            checked={sameAddress}
                                            onCheckedChange={(c) => {
                                                const on = c === true;
                                                setSameAddress(on);
                                                if (on) setData('ktp_address', data.address);
                                            }}
                                        />
                                        <Label htmlFor="same_address" className="text-muted-foreground text-sm font-normal">
                                            Sama dengan alamat domisili
                                        </Label>
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </Section>

                    <Section title="Keanggotaan" description="Status, asal, dan akun yang terhubung dengan jemaat ini.">
                        <div className={grid3}>
                            <Field label="Status keanggotaan" id="membership_status" required error={err.membership_status}>
                                <Select value={data.membership_status} onValueChange={(v) => setData('membership_status', v)}>
                                    <SelectTrigger id="membership_status">
                                        <SelectValue placeholder="Pilih status keanggotaan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lookups.membershipStatus.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Tanggal diterima" id="membership_date" error={err.membership_date}>
                                <DatePicker id="membership_date" value={data.membership_date} onChange={(v) => setData('membership_date', v)} clearable />
                            </Field>
                            <Field label="Gereja asal" id="previous_church" error={err.previous_church}>
                                <Input {...text('previous_church')} />
                            </Field>
                            <Field label="Wilayah" id="wilayah" error={err.wilayah}>
                                {choice('wilayah', lookups.wilayah, 'Pilih wilayah')}
                            </Field>
                            <Field
                                label="Akun pengguna"
                                id="user_id"
                                error={err.user_id}
                                className="space-y-2 md:col-span-2"
                                hint="Dengan akun yang ditautkan, jemaat dapat melihat riwayat pemberiannya sendiri di portal."
                            >
                                <Select value={data.user_id || NONE} onValueChange={(v) => setData('user_id', v === NONE ? '' : v)}>
                                    <SelectTrigger id="user_id">
                                        <SelectValue placeholder="Pilih akun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>Tidak ditautkan</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>
                        <div className="mt-4 space-y-1 border-t pt-4">
                            <div className="flex items-center gap-3">
                                <Switch id="is_active" checked={data.is_active} onCheckedChange={(c) => setData('is_active', c)} />
                                <Label htmlFor="is_active">Aktif</Label>
                            </div>
                            {autoInactive && <p className="text-muted-foreground text-xs">Jemaat dengan status ini otomatis dinonaktifkan.</p>}
                            <InputError message={err.is_active} />
                        </div>
                    </Section>

                    <Section title="Kontak darurat" description="Orang yang dihubungi bila terjadi keadaan mendesak.">
                        <div className={grid3}>
                            <Field label="Nama" id="emergency_name" error={err.emergency_name}>
                                <Input {...text('emergency_name')} />
                            </Field>
                            <Field label="Telepon" id="emergency_phone" error={err.emergency_phone}>
                                <Input {...text('emergency_phone')} inputMode="tel" />
                            </Field>
                            <Field label="Hubungan" id="emergency_relation" error={err.emergency_relation}>
                                <Input {...text('emergency_relation')} />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Catatan" description="Informasi tambahan yang perlu diketahui pengurus.">
                        <Field label="Catatan" id="notes" error={err.notes}>
                            <Textarea {...text('notes')} rows={4} />
                        </Field>
                    </Section>

                    {customFields && customFields.definitions.length > 0 && (
                        <DynamicFields
                            definitions={customFields.definitions}
                            values={data.attributes}
                            errors={err}
                            onChange={(key, value) => setData('attributes', { ...data.attributes, [key]: value })}
                        />
                    )}
                </div>

                <div className="bg-background/90 sticky bottom-0 z-10 border-t backdrop-blur">
                    <div className="flex items-center justify-end gap-3 px-4 py-3 md:px-6 lg:px-8">
                        <Button variant="outline" asChild>
                            <Link href={isEdit ? route('admin.members.show', member.id) : route('admin.members.index')}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                            Simpan
                        </Button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
