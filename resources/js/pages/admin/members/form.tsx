import DynamicFields from '@/components/dynamic-fields';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type CustomFieldsProp } from '@/types/attributes';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface MemberData {
    id: number;
    member_number: string | null;
    name: string;
    gender: 'L' | 'P' | null;
    birth_date: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    user_id: number | null;
    is_active: boolean;
}

export default function MemberForm({
    member,
    users,
    customFields,
}: {
    member: MemberData | null;
    users: UserOption[];
    customFields?: CustomFieldsProp;
}) {
    const isEdit = member !== null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jemaat', href: '/admin/members' },
        { title: isEdit ? 'Edit Jemaat' : 'Tambah Jemaat', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        member_number: member?.member_number ?? '',
        name: member?.name ?? '',
        gender: member?.gender ?? '',
        birth_date: member?.birth_date ?? '',
        phone: member?.phone ?? '',
        email: member?.email ?? '',
        address: member?.address ?? '',
        user_id: member?.user_id ? String(member.user_id) : '',
        is_active: member?.is_active ?? true,
        attributes: customFields?.values ?? {},
    });

    const handleAttributeChange = (key: string, value: any) => {
        setData('attributes', {
            ...data.attributes,
            [key]: value,
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const payload = {
            ...data,
            user_id: data.user_id ? Number(data.user_id) : null,
            gender: data.gender || null,
        };

        if (isEdit) {
            put(route('admin.members.update', member.id));
        } else {
            post(route('admin.members.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Jemaat' : 'Tambah Jemaat'} />
            <div className="space-y-6 p-4 max-w-2xl">
                <PageHeader
                    title={isEdit ? 'Edit Jemaat' : 'Tambah Jemaat'}
                    description={
                        isEdit ? `Perbarui informasi anggota jemaat ${member.name}` : 'Daftarkan anggota jemaat baru.'
                    }
                />

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identitas Jemaat</CardTitle>
                            <CardDescription>Data personal dan informasi kontak anggota jemaat.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="member_number">Nomor Jemaat</Label>
                                    <Input
                                        id="member_number"
                                        value={data.member_number}
                                        onChange={(e) => setData('member_number', e.target.value)}
                                        placeholder="Contoh: JM-00123"
                                    />
                                    <InputError message={errors.member_number} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="gender">Jenis Kelamin</Label>
                                    <Select
                                        value={data.gender}
                                        onValueChange={(val) => setData('gender', val)}
                                    >
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Pilih jenis kelamin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="L">Laki-laki</SelectItem>
                                            <SelectItem value="P">Perempuan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.gender} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="name">Nama Lengkap *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Binsar Siregar"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="birth_date">Tanggal Lahir</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={data.birth_date}
                                        onChange={(e) => setData('birth_date', e.target.value)}
                                    />
                                    <InputError message={errors.birth_date} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="phone">Nomor Telepon</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="08123456789"
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="jemaat@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={2}
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="user_id">Tautkan Akun Pengguna</Label>
                                <Select
                                    value={data.user_id ? String(data.user_id) : 'none'}
                                    onValueChange={(val) => setData('user_id', val === 'none' ? '' : val)}
                                >
                                    <SelectTrigger id="user_id">
                                        <SelectValue placeholder="Pilih akun untuk akses portal jemaat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tidak ditautkan --</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Satu akun pengguna hanya dapat ditautkan ke satu profil jemaat.
                                </p>
                                <InputError message={errors.user_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {customFields && customFields.definitions.length > 0 && (
                        <DynamicFields
                            definitions={customFields.definitions}
                            values={data.attributes}
                            errors={errors as Record<string, string>}
                            onChange={handleAttributeChange}
                        />
                    )}

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={route('admin.members.index')}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Simpan Perubahan' : 'Tambah Jemaat'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
