import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEventHandler } from 'react';

interface WilayahData {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    coverage: string | null;
    meeting_info: string | null;
    is_active: boolean;
}

export default function WilayahForm({ wilayah }: { wilayah: WilayahData | null }) {
    const isEdit = wilayah !== null;
    const { data, setData, post, put, processing, errors } = useForm({
        name: wilayah?.name ?? '',
        code: wilayah?.code ?? '',
        coverage: wilayah?.coverage ?? '',
        meeting_info: wilayah?.meeting_info ?? '',
        description: wilayah?.description ?? '',
        is_active: wilayah?.is_active ?? true,
    });

    const backUrl = isEdit ? route('admin.wilayah.show', wilayah.id) : route('admin.wilayah.index');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Wilayah', href: route('admin.wilayah.index') },
        { title: isEdit ? 'Ubah wilayah' : 'Tambah wilayah', href: '#' },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) put(route('admin.wilayah.update', wilayah.id));
        else post(route('admin.wilayah.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? `Ubah ${wilayah.name}` : 'Tambah wilayah'} />
            <form onSubmit={submit} className="flex min-h-full flex-col">
                <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
                    <PageHeader back={backUrl} title={isEdit ? 'Ubah wilayah' : 'Tambah wilayah'} description="Wilayah dipasang pada keluarga; jemaat mengikuti wilayah keluarganya." />

                    <Card>
                        <CardHeader>
                            <CardTitle>Identitas wilayah</CardTitle>
                            <CardDescription>Nama dan kode yang tampil di daftar jemaat dan keluarga.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama wilayah *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Contoh: Wilayah A" required />
                                <InputError message={errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Kode</Label>
                                <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="A" />
                                <InputError message={errors.code} />
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-lg border p-3 md:col-span-2">
                                <div>
                                    <Label htmlFor="is_active">Wilayah aktif</Label>
                                    <p className="text-muted-foreground text-xs">Wilayah nonaktif tidak muncul sebagai pilihan baru.</p>
                                </div>
                                <Switch id="is_active" checked={data.is_active} onCheckedChange={(c) => setData('is_active', c)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cakupan dan jadwal</CardTitle>
                            <CardDescription>Area yang termasuk dan jadwal persekutuan wilayah.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="coverage">Cakupan wilayah</Label>
                                <Textarea id="coverage" rows={3} value={data.coverage} onChange={(e) => setData('coverage', e.target.value)} placeholder="RW atau komplek yang termasuk, contoh: RW 01 sampai RW 03, Komplek Griya Asri" />
                                <InputError message={errors.coverage} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meeting_info">Jadwal persekutuan</Label>
                                <Input id="meeting_info" value={data.meeting_info} onChange={(e) => setData('meeting_info', e.target.value)} placeholder="Persekutuan wilayah setiap Jumat 19.00" />
                                <InputError message={errors.meeting_info} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Deskripsi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Label htmlFor="description" className="sr-only">
                                Deskripsi
                            </Label>
                            <Textarea id="description" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            <InputError message={errors.description} />
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-background/95 sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t px-4 py-3 backdrop-blur md:px-6 lg:px-8">
                    <Button asChild variant="outline">
                        <Link href={backUrl}>Batal</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        {isEdit ? 'Simpan Perubahan' : 'Tambah Wilayah'}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
