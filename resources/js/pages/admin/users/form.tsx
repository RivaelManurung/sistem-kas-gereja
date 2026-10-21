import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type Option } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface EditableUser {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

export default function UserForm({ user, roleOptions }: { user: EditableUser | null; roleOptions: Option[] }) {
    const isEdit = user !== null;
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
        roles: user?.roles ?? ([] as string[]),
    });

    const toggleRole = (value: string, checked: boolean) => {
        setData('roles', checked ? [...data.roles, value] : data.roles.filter((role) => role !== value));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.users.update', user.id));
        } else {
            post(route('admin.users.store'));
        }
    };

    const title = isEdit ? 'Ubah Pengguna' : 'Tambah Pengguna';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Pengguna', href: '/admin/users' },
                { title, href: '#' },
            ]}
        >
            <Head title={title} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('admin.users.index')}
                    title={title}
                    description={isEdit ? `Perbarui akun ${user.name} dan perannya.` : 'Buat akun baru lalu tentukan perannya.'}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Data Akun</CardTitle>
                        <CardDescription>Peran menentukan menu dan hak akses pengguna.</CardDescription>
                    </CardHeader>
                    <CardContent>
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Kata sandi{isEdit && ' (kosongkan bila tidak diubah)'}</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required={!isEdit}
                            />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Ulangi kata sandi</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                required={!isEdit}
                            />
                        </div>
                    </div>

                    <fieldset className="grid gap-3">
                        <legend className="mb-2 text-sm font-medium">Peran</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {roleOptions.map((option) => (
                                <label key={option.value} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.roles.includes(option.value)}
                                        onCheckedChange={(checked) => toggleRole(option.value, checked === true)}
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.roles} />
                    </fieldset>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button variant="outline" asChild>
                            <Link href={route('admin.users.index')}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                        </Button>
                    </div>
                </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
