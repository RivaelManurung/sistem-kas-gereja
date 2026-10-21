import DynamicFields from '@/components/dynamic-fields';
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
import { type CustomFieldsProp } from '@/types/attributes';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface FundOption {
    id: number;
    code: string;
    name: string;
}

interface CategoryData {
    id: number;
    name: string;
    direction: 'in' | 'out';
    default_fund_id: number;
    allows_named: boolean;
    is_public: boolean;
    is_active: boolean;
    sort_order: number;
}

export default function CategoryForm({
    category,
    funds,
    directionOptions,
    customFields,
}: {
    category: CategoryData | null;
    funds: FundOption[];
    directionOptions: Option[];
    customFields?: CustomFieldsProp;
}) {
    const isEdit = category !== null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Kategori', href: '/admin/categories' },
        { title: isEdit ? 'Edit Kategori' : 'Tambah Kategori', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name: category?.name ?? '',
        direction: category?.direction ?? 'in',
        default_fund_id: category?.default_fund_id ? String(category.default_fund_id) : (funds[0] ? String(funds[0].id) : ''),
        allows_named: category?.allows_named ?? false,
        is_public: category?.is_public ?? true,
        is_active: category?.is_active ?? true,
        sort_order: category?.sort_order ?? 0,
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
        if (isEdit) {
            put(route('admin.categories.update', category.id));
        } else {
            post(route('admin.categories.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Kategori' : 'Tambah Kategori'} />
            <div className="space-y-6 p-4 max-w-2xl">
                <PageHeader
                    title={isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
                    description={
                        isEdit ? `Perbarui kategori kas ${category.name}` : 'Tambahkan klasifikasi pos transaksi baru.'
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Data Kategori</CardTitle>
                        <CardDescription>Pilih arah kas dan pos dana default tempat transaksi dicatat.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="direction">Arah Kas *</Label>
                                <Select
                                    value={data.direction}
                                    onValueChange={(val: 'in' | 'out') => {
                                        setData((prev) => ({
                                            ...prev,
                                            direction: val,
                                            allows_named: val === 'out' ? false : prev.allows_named,
                                        }));
                                    }}
                                >
                                    <SelectTrigger id="direction">
                                        <SelectValue placeholder="Pilih arah kas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {directionOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.direction} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="name">Nama Kategori *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Kolekte, Listrik & Air"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="default_fund_id">Pos Dana Default *</Label>
                                <Select
                                    value={String(data.default_fund_id)}
                                    onValueChange={(val) => setData('default_fund_id', val)}
                                >
                                    <SelectTrigger id="default_fund_id">
                                        <SelectValue placeholder="Pilih dana tujuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {funds.map((fund) => (
                                            <SelectItem key={fund.id} value={String(fund.id)}>
                                                {fund.code} - {fund.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.default_fund_id} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="sort_order">Nomor Urutan Tampilan</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min={0}
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', Number(e.target.value))}
                                />
                                <InputError message={errors.sort_order} />
                            </div>

                            {data.direction === 'in' && (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="allows_named">Dapat Dicatat Atas Nama Jemaat</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Aktifkan jika persembahan ini dapat ditautkan ke data jemaat tertentu (misal: Perpuluhan, Syukur).
                                        </p>
                                    </div>
                                    <Switch
                                        id="allows_named"
                                        checked={data.allows_named}
                                        onCheckedChange={(checked) => setData('allows_named', checked)}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_public">Tampilkan di Laporan Publik</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Jika diaktifkan, total agregat kategori ini akan muncul di halaman publik transparansi.
                                    </p>
                                </div>
                                <Switch
                                    id="is_public"
                                    checked={data.is_public}
                                    onCheckedChange={(checked) => setData('is_public', checked)}
                                />
                            </div>

                            {customFields && (
                                <DynamicFields
                                    definitions={customFields.definitions}
                                    values={data.attributes}
                                    errors={errors as Record<string, string>}
                                    onChange={handleAttributeChange}
                                />
                            )}

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.categories.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
