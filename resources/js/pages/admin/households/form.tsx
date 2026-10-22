import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEventHandler } from 'react';

interface HouseholdData {
    id: number;
    name: string;
    family_number: string | null;
    address: string | null;
    rt_rw: string | null;
    kelurahan: string | null;
    kecamatan: string | null;
    city: string | null;
    postal_code: string | null;
    housing_status: string | { value: string; label: string } | null;
    phone: string | null;
    notes: string | null;
    wilayah_id: number | null;
    is_active: boolean;
}

const NONE = '__none__';

export default function HouseholdForm({ household, housingStatus, nextNumber, wilayahs }: { household: HouseholdData | null; wilayahs: Array<{ id: number; name: string }>; housingStatus: Array<{ value: string; label: string }>; nextNumber: string | null }) {
    const isEdit = household !== null;
    const hs = household?.housing_status;
    const { data, setData, post, put, processing, errors } = useForm({
        name: household?.name ?? '',
        family_number: household?.family_number ?? nextNumber ?? '',
        address: household?.address ?? '',
        rt_rw: household?.rt_rw ?? '',
        kelurahan: household?.kelurahan ?? '',
        kecamatan: household?.kecamatan ?? '',
        city: household?.city ?? '',
        postal_code: household?.postal_code ?? '',
        housing_status: (typeof hs === 'object' && hs ? hs.value : hs) ?? '',
        phone: household?.phone ?? '',
        wilayah_id: household?.wilayah_id ? String(household.wilayah_id) : '',
        notes: household?.notes ?? '',
        is_active: household?.is_active ?? true,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Keluarga', href: route('admin.households.index') },
        { title: isEdit ? 'Ubah keluarga' : 'Tambah keluarga', href: '#' },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) put(route('admin.households.update', household.id));
        else post(route('admin.households.store'));
    };

    const text = (key: 'name' | 'family_number' | 'rt_rw' | 'kelurahan' | 'kecamatan' | 'city' | 'phone', label: string, extra?: { placeholder?: string; required?: boolean }) => (
        <div className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input id={key} value={data[key]} onChange={(e) => setData(key, e.target.value)} placeholder={extra?.placeholder} required={extra?.required} />
            <InputError message={errors[key]} />
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? `Ubah ${household.name}` : 'Tambah keluarga'} />
            <form onSubmit={submit} className="flex min-h-full flex-col">
                <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
                    <PageHeader back={isEdit ? route('admin.households.show', household.id) : route('admin.households.index')} title={isEdit ? 'Ubah keluarga' : 'Tambah keluarga'} description="Data keluarga dipakai bersama oleh semua anggotanya." />

                    <Card>
                        <CardHeader>
                            <CardTitle>Keluarga</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {text('name', 'Nama keluarga', { placeholder: 'Contoh: Keluarga Simanjuntak', required: true })}
                            {text('family_number', 'Nomor keluarga')}
                            {text('phone', 'Telepon')}
                            <div className="space-y-2">
                                <Label htmlFor="housing_status">Status tempat tinggal</Label>
                                <Select value={data.housing_status} onValueChange={(v) => setData('housing_status', v)}>
                                    <SelectTrigger id="housing_status">
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {housingStatus.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.housing_status} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wilayah_id">Wilayah</Label>
                                <Select value={data.wilayah_id || NONE} onValueChange={(v) => setData('wilayah_id', v === NONE ? '' : v)}>
                                    <SelectTrigger id="wilayah_id">
                                        <SelectValue placeholder="Pilih wilayah" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE}>Belum ditentukan</SelectItem>
                                        {wilayahs.map((w) => (
                                            <SelectItem key={w.id} value={String(w.id)}>
                                                {w.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.wilayah_id} />
                            </div>
                            <div className="flex items-center justify-between gap-4 rounded-lg border p-3 md:col-span-2 xl:col-span-2">
                                <div>
                                    <Label htmlFor="is_active">Keluarga aktif</Label>
                                    <p className="text-muted-foreground text-xs">Keluarga nonaktif tidak muncul sebagai pilihan baru.</p>
                                </div>
                                <Switch id="is_active" checked={data.is_active} onCheckedChange={(c) => setData('is_active', c)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Alamat</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <div className="space-y-2 md:col-span-2 xl:col-span-3">
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea id="address" rows={2} value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="Jalan dan nomor rumah" />
                                <InputError message={errors.address} />
                            </div>
                            {text('rt_rw', 'RT/RW', { placeholder: '003/005' })}
                            {text('kelurahan', 'Kelurahan')}
                            {text('kecamatan', 'Kecamatan')}
                            {text('city', 'Kota')}
                            <div className="space-y-2">
                                <Label htmlFor="postal_code">Kode pos</Label>
                                <Input id="postal_code" inputMode="numeric" maxLength={5} value={data.postal_code} onChange={(e) => setData('postal_code', e.target.value.replace(/\D/g, '').slice(0, 5))} className="tabular-nums" />
                                <InputError message={errors.postal_code} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Label htmlFor="notes" className="sr-only">
                                Catatan
                            </Label>
                            <Textarea id="notes" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} />
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-background/95 sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t px-4 py-3 backdrop-blur md:px-6 lg:px-8">
                    <Button asChild variant="outline">
                        <Link href={isEdit ? route('admin.households.show', household.id) : route('admin.households.index')}>Batal</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                        Simpan
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
