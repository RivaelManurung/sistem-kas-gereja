import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Option } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface AccountData {
    id: number;
    code: string;
    name: string;
    type: string;
    bank_name: string | null;
    account_number: string | null;
    is_active: boolean;
}

export default function AccountForm({
    account,
    typeOptions,
}: {
    account: AccountData | null;
    typeOptions: Option[];
}) {
    const isEdit = account !== null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Rekening', href: '/admin/accounts' },
        { title: isEdit ? 'Edit Rekening' : 'Tambah Rekening', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        code: account?.code ?? '',
        name: account?.name ?? '',
        type: account?.type ?? 'cash',
        bank_name: account?.bank_name ?? '',
        account_number: account?.account_number ?? '',
        is_active: account?.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.accounts.update', account.id));
        } else {
            post(route('admin.accounts.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Rekening' : 'Tambah Rekening'} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('admin.accounts.index')}
                    title={isEdit ? 'Edit Rekening' : 'Tambah Rekening'}
                    description={
                        isEdit
                            ? `Perbarui informasi rekening ${account.name}`
                            : 'Tambahkan kas fisik atau rekening bank baru.'
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Data Rekening</CardTitle>
                        <CardDescription>Kode rekening harus unik dan ditulis dalam huruf kapital.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Kode Rekening *</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="Contoh: KAS, BCA, BRI"
                                    required
                                />
                                <InputError message={errors.code} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Rekening *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Kas Operasional, Rekening BCA Gereja"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Jenis Rekening *</Label>
                                <Select value={data.type} onValueChange={(val) => setData('type', val)}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Pilih jenis rekening" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            {data.type === 'bank' && (
                                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                                    <div className="space-y-2">
                                        <Label htmlFor="bank_name">Nama Bank *</Label>
                                        <Input
                                            id="bank_name"
                                            value={data.bank_name}
                                            onChange={(e) => setData('bank_name', e.target.value)}
                                            placeholder="Contoh: Bank Central Asia (BCA)"
                                            required
                                        />
                                        <InputError message={errors.bank_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="account_number">Nomor Rekening *</Label>
                                        <Input
                                            id="account_number"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                            placeholder="Contoh: 1234567890"
                                            required
                                        />
                                        <InputError message={errors.account_number} />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.accounts.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {isEdit ? 'Simpan Perubahan' : 'Tambah Rekening'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
