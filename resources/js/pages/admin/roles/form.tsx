import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEventHandler } from 'react';
import { type RoleSummary } from './index';

interface Props {
    role: RoleSummary | null;
    groups: Array<{ group: string; permissions: Array<{ value: string; label: string }> }>;
    granted: string[];
    copiedFrom: string | null;
    grantable: string[];
}

export default function RoleForm({ role, groups, granted, copiedFrom, grantable }: Props) {
    const isEdit = role !== null;
    const { data, setData, post, put, processing, errors } = useForm({
        label: role?.label ?? '',
        description: role?.description ?? '',
        permissions: granted,
    });

    const total = groups.reduce((n, g) => n + g.permissions.length, 0);
    const canGrant = (value: string) => grantable.includes(value) || granted.includes(value);
    const toggle = (value: string, on: boolean) => setData('permissions', on ? [...data.permissions, value] : data.permissions.filter((p) => p !== value));
    const toggleGroup = (values: string[], on: boolean) => {
        const editable = values.filter(canGrant);
        const rest = data.permissions.filter((p) => !editable.includes(p));
        setData('permissions', on ? [...rest, ...editable] : rest);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) put(route('admin.roles.update', role.id));
        else post(route('admin.roles.store'));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Peran & Hak Akses', href: '/admin/roles' },
        { title: isEdit ? `Ubah ${role.label}` : 'Buat peran', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? `Ubah ${role.label}` : 'Buat peran'} />
            <form onSubmit={submit} className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={isEdit ? route('admin.roles.show', role.id) : route('admin.roles.index')}
                    title={isEdit ? `Ubah peran ${role.label}` : 'Buat peran baru'}
                    description={copiedFrom ? `Hak akses disalin dari ${copiedFrom}. Sesuaikan sebelum menyimpan.` : 'Beri nama peran, lalu pilih hal apa saja yang boleh dilakukan pemegangnya.'}
                />

                <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="space-y-1">
                                <CardTitle>Identitas peran</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="label">Nama peran</Label>
                                    <Input id="label" value={data.label} onChange={(e) => setData('label', e.target.value)} placeholder="Contoh: Bendahara Komisi" required autoFocus />
                                    <InputError message={errors.label} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Textarea id="description" rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Tugas singkat pemegang peran ini" />
                                    <InputError message={errors.description} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="space-y-1">
                                <CardTitle>Hak akses</CardTitle>
                                <CardDescription>Pengguna hanya bisa melakukan hal yang dicentang. Izin yang tidak Anda miliki tidak bisa diberikan.</CardDescription>
                                <InputError message={errors.permissions} />
                            </CardHeader>
                            <CardContent className="divide-border divide-y p-0 md:p-0">
                                {groups.map((g) => {
                                    const values = g.permissions.map((p) => p.value);
                                    const selected = values.filter((v) => data.permissions.includes(v)).length;
                                    const state = selected === 0 ? false : selected === values.length ? true : 'indeterminate';
                                    return (
                                        <fieldset key={g.group} className="grid gap-3 px-5 py-4 md:grid-cols-[200px_1fr] md:px-6">
                                            <legend className="sr-only">{g.group}</legend>
                                            <div className="flex items-start gap-2.5">
                                                <Checkbox
                                                    id={`group-${g.group}`}
                                                    checked={state}
                                                    onCheckedChange={(c) => toggleGroup(values, c === true)}
                                                    aria-label={`Pilih semua izin ${g.group}`}
                                                    className="mt-0.5"
                                                />
                                                <Label htmlFor={`group-${g.group}`} className="font-medium">
                                                    {g.group}
                                                    <span className="text-muted-foreground block text-xs font-normal tabular-nums">
                                                        {selected} dari {values.length}
                                                    </span>
                                                </Label>
                                            </div>
                                            <ul className="space-y-2.5">
                                                {g.permissions.map((p) => {
                                                    const allowed = canGrant(p.value);
                                                    return (
                                                        <li key={p.value} className="flex items-center gap-2.5">
                                                            <Checkbox
                                                                id={p.value}
                                                                checked={data.permissions.includes(p.value)}
                                                                disabled={!allowed}
                                                                onCheckedChange={(c) => toggle(p.value, c === true)}
                                                            />
                                                            <Label htmlFor={p.value} className={cn('font-normal', !allowed && 'text-muted-foreground')}>
                                                                {p.label}
                                                                {!allowed && <span className="text-muted-foreground ml-2 text-xs">Anda tidak memiliki izin ini</span>}
                                                            </Label>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </fieldset>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-4 xl:sticky xl:top-20">
                        <Card>
                            <CardContent className="space-y-4 pt-5 md:pt-6">
                                <div>
                                    <p className="text-muted-foreground text-sm">Izin dipilih</p>
                                    <p className="text-3xl font-semibold tracking-tight tabular-nums">
                                        {data.permissions.length}
                                        <span className="text-muted-foreground text-base font-normal"> dari {total}</span>
                                    </p>
                                </div>
                                <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden="true">
                                    <div className="bg-primary h-full rounded-full transition-[width] duration-200" style={{ width: `${(data.permissions.length / Math.max(total, 1)) * 100}%` }} />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Button type="submit" className="flex-1" disabled={processing}>
                                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                                        {isEdit ? 'Simpan perubahan' : 'Buat peran'}
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href={isEdit ? route('admin.roles.show', role.id) : route('admin.roles.index')}>Batal</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </form>
        </AppLayout>
    );
}
