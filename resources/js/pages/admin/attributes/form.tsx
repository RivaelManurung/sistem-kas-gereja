import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Option } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface AttributeData {
    id: number;
    entity_type: string;
    key: string;
    label: string;
    data_type: string;
    options: string[] | null;
    is_required: boolean;
    is_public: boolean;
    is_active: boolean;
    sort_order: number;
    scope_event_id: number | null;
}

export default function AttributeForm({
    definition,
    hasValues = false,
    entityOptions,
    typeOptions,
}: {
    definition: AttributeData | null;
    hasValues?: boolean;
    entityOptions: Option[];
    typeOptions: Option[];
}) {
    const isEdit = definition !== null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Atribut Kustom', href: '/admin/attributes' },
        { title: isEdit ? 'Edit Atribut' : 'Tambah Atribut', href: '#' },
    ];

    const [optionInput, setOptionInput] = useState<string>(
        definition?.options?.join('\n') ?? ''
    );

    const { data, setData, post, put, processing, errors } = useForm({
        entity_type: definition?.entity_type ?? 'member',
        key: definition?.key ?? '',
        label: definition?.label ?? '',
        data_type: definition?.data_type ?? 'text',
        options: definition?.options ?? [],
        is_required: definition?.is_required ?? false,
        is_public: definition?.is_public ?? true,
        is_active: definition?.is_active ?? true,
        sort_order: definition?.sort_order ?? 0,
        scope_event_id: definition?.scope_event_id ?? null,
    });

    const handleOptionsChange = (val: string) => {
        setOptionInput(val);
        const lines = val
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        setData('options', lines);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.attributes.update', definition.id));
        } else {
            post(route('admin.attributes.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Atribut' : 'Tambah Atribut'} />
            <div className="space-y-6 p-4 max-w-2xl">
                <PageHeader
                    title={isEdit ? 'Edit Atribut' : 'Tambah Atribut'}
                    description={
                        isEdit
                            ? `Perbarui definisi kolom ${definition.label}`
                            : 'Definisikan kolom formulir dinamis baru untuk entitas tertentu.'
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Spesifikasi Kolom</CardTitle>
                        <CardDescription>
                            Kunci atribut (key) tidak dapat diubah setelah dibuat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            {!isEdit && (
                                <div className="space-y-1">
                                    <Label htmlFor="entity_type">Entitas Tujuan *</Label>
                                    <Select
                                        value={data.entity_type}
                                        onValueChange={(val) => setData('entity_type', val)}
                                    >
                                        <SelectTrigger id="entity_type">
                                            <SelectValue placeholder="Pilih entitas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {entityOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.entity_type} />
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label htmlFor="key">Kunci Unik (Key) *</Label>
                                <Input
                                    id="key"
                                    value={data.key}
                                    onChange={(e) => setData('key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="Contoh: sektor_pelayanan, jumlah_peserta"
                                    disabled={isEdit}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Format: huruf kecil, angka, atau garis bawah (contoh: `komisi_pj`).
                                </p>
                                <InputError message={errors.key} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="label">Label Tampilan *</Label>
                                <Input
                                    id="label"
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    placeholder="Contoh: Sektor Pelayanan, Jumlah Peserta"
                                    required
                                />
                                <InputError message={errors.label} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="data_type">Tipe Data *</Label>
                                <Select
                                    value={data.data_type}
                                    onValueChange={(val) => setData('data_type', val)}
                                    disabled={isEdit && hasValues}
                                >
                                    <SelectTrigger id="data_type">
                                        <SelectValue placeholder="Pilih tipe data" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isEdit && hasValues && (
                                    <p className="text-xs text-amber-600">
                                        Tipe data terkunci karena atribut ini sudah memiliki nilai tersimpan.
                                    </p>
                                )}
                                <InputError message={errors.data_type} />
                            </div>

                            {data.data_type === 'select' && (
                                <div className="space-y-1 rounded-lg border p-4 bg-muted/20">
                                    <Label htmlFor="options">Opsi Pilihan (satu per baris) *</Label>
                                    <textarea
                                        id="options"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        rows={4}
                                        value={optionInput}
                                        onChange={(e) => handleOptionsChange(e.target.value)}
                                        placeholder="Pilihan 1&#10;Pilihan 2&#10;Pilihan 3"
                                    />
                                    <InputError message={errors.options} />
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label htmlFor="sort_order">Nomor Urutan</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min={0}
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', Number(e.target.value))}
                                />
                                <InputError message={errors.sort_order} />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_required">Wajib Diisi (Required)</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Pengguna tidak dapat menyimpan form jika kolom ini kosong.
                                    </p>
                                </div>
                                <Switch
                                    id="is_required"
                                    checked={data.is_required}
                                    onCheckedChange={(checked) => setData('is_required', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_public">Tampil di Ringkasan Publik</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Jika diaktifkan, kolom ini diizinkan tampil pada agregat transparansi.
                                    </p>
                                </div>
                                <Switch
                                    id="is_public"
                                    checked={data.is_public}
                                    onCheckedChange={(checked) => setData('is_public', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.attributes.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {isEdit ? 'Simpan Perubahan' : 'Tambah Atribut'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
