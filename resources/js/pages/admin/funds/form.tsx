import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface FundData {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
}

export default function FundForm({ fund }: { fund: FundData | null }) {
    const isEdit = fund !== null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dana', href: '/admin/funds' },
        { title: isEdit ? 'Edit Dana' : 'Tambah Dana', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        code: fund?.code ?? '',
        name: fund?.name ?? '',
        description: fund?.description ?? '',
        is_active: fund?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.funds.update', fund.id));
        } else {
            post(route('admin.funds.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Dana' : 'Tambah Dana'} />
            <div className="space-y-6 p-4 max-w-2xl">
                <PageHeader
                    title={isEdit ? 'Edit Dana' : 'Tambah Dana'}
                    description={
                        isEdit ? `Perbarui informasi pos dana ${fund.name}` : 'Tambahkan pos alokasi dana kas baru.'
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Data Dana</CardTitle>
                        <CardDescription>Kode dana harus unik dan ditulis dalam huruf kapital.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="code">Kode Dana *</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="Contoh: UMUM, PEMB, DIAK"
                                    required
                                />
                                <InputError message={errors.code} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="name">Nama Dana *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Kas Umum, Dana Pembangunan"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Keterangan peruntukan dana ini..."
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.funds.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {isEdit ? 'Simpan Perubahan' : 'Tambah Dana'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
