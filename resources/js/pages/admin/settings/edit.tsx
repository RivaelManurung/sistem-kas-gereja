import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ImageField } from '@/components/app/image-field';
import { type SharedData } from '@/types';
import { FormEventHandler, useState } from 'react';

interface ChurchSettingData {
    id: number;
    name: string;
    system_name: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    timezone: string;
    logo_path: string | null;
    denominations: number[];
    min_confirmations_service: number;
    min_confirmations_event: number;
    min_confirmations_general: number;
    expense_approval_threshold: number;
    allow_negative_balance: boolean;
    public_page_enabled: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pengaturan Gereja', href: '/admin/settings' }];

export default function SettingsEdit({ settings }: { settings: ChurchSettingData }) {
    const { brand } = usePage<SharedData>().props;
    const [denomInput, setDenomInput] = useState<string>(
        settings.denominations?.join(', ') || ''
    );

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        _method: 'PUT',
        name: settings.name || '',
        system_name: settings.system_name || '',
        address: settings.address || '',
        city: settings.city || '',
        phone: settings.phone || '',
        email: settings.email || '',
        timezone: settings.timezone || 'Asia/Jakarta',
        logo: null as File | null,
        favicon: null as File | null,
        remove_logo: false as boolean,
        remove_favicon: false as boolean,
        denominations: settings.denominations || [],
        min_confirmations_service: settings.min_confirmations_service ?? 2,
        min_confirmations_event: settings.min_confirmations_event ?? 2,
        min_confirmations_general: settings.min_confirmations_general ?? 2,
        expense_approval_threshold: settings.expense_approval_threshold ?? 0,
        allow_negative_balance: settings.allow_negative_balance ?? false,
        public_page_enabled: settings.public_page_enabled ?? false,
    });

    const handleDenomChange = (val: string) => {
        setDenomInput(val);
        const parsed = val
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
            .map((s) => Number(s))
            .filter((n) => !isNaN(n));
        setData('denominations', parsed);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Gereja" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Pengaturan Gereja"
                    description="Kelola informasi gereja, pecahan uang, ambang batas pengeluaran, dan visibilitas laporan."
                />

                <form onSubmit={submit} className="space-y-6">
                    <Tabs defaultValue="identity" className="w-full">
                        <TabsList className="grid w-full max-w-2xl grid-cols-5">
                            <TabsTrigger value="identity">Identitas</TabsTrigger>
                            <TabsTrigger value="profile">Profil</TabsTrigger>
                            <TabsTrigger value="counting">Penghitungan</TabsTrigger>
                            <TabsTrigger value="finance">Keuangan</TabsTrigger>
                            <TabsTrigger value="public">Publik</TabsTrigger>
                        </TabsList>

                        <TabsContent value="identity" className="mt-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Identitas sistem</CardTitle>
                                    <CardDescription>Nama, logo, dan favicon tampil di sidebar, halaman masuk, tab peramban, dan kop laporan.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="max-w-md space-y-1">
                                        <Label htmlFor="system_name">Nama sistem</Label>
                                        <Input
                                            id="system_name"
                                            value={data.system_name}
                                            onChange={(e) => setData('system_name', e.target.value)}
                                            placeholder="Kas Gereja"
                                            maxLength={60}
                                        />
                                        <p className="text-xs text-muted-foreground">Kosongkan untuk memakai nama bawaan, Kas Gereja.</p>
                                        <InputError message={errors.system_name} />
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <ImageField
                                            id="logo"
                                            label="Logo"
                                            hint="PNG, JPG, atau WebP, maksimal 2 MB. Disarankan persegi dengan latar transparan."
                                            currentUrl={brand.logo_url}
                                            file={data.logo}
                                            removed={data.remove_logo}
                                            onFile={(f) => {
                                                setData('logo', f);
                                                setData('remove_logo', false);
                                            }}
                                            onRemove={() => {
                                                setData('logo', null);
                                                setData('remove_logo', true);
                                            }}
                                            error={errors.logo}
                                            previewClassName="size-20"
                                        />
                                        <ImageField
                                            id="favicon"
                                            label="Favicon"
                                            hint="PNG atau ICO persegi, maksimal 512 KB. Ikon kecil di tab peramban."
                                            currentUrl={brand.favicon_url}
                                            file={data.favicon}
                                            removed={data.remove_favicon}
                                            onFile={(f) => {
                                                setData('favicon', f);
                                                setData('remove_favicon', false);
                                            }}
                                            onRemove={() => {
                                                setData('favicon', null);
                                                setData('remove_favicon', true);
                                            }}
                                            error={errors.favicon}
                                            accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp"
                                            previewClassName="size-12"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="profile" className="mt-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profil Gereja</CardTitle>
                                    <CardDescription>Informasi identitas gereja untuk kop laporan dan warta.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Gereja *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Alamat</Label>
                                        <Textarea
                                            id="address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={2}
                                        />
                                        <InputError message={errors.address} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">Kota</Label>
                                            <Input
                                                id="city"
                                                value={data.city}
                                                onChange={(e) => setData('city', e.target.value)}
                                            />
                                            <InputError message={errors.city} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Nomor Telepon</Label>
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                            />
                                            <InputError message={errors.phone} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                            />
                                            <InputError message={errors.email} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Zona Waktu</Label>
                                            <Input
                                                id="timezone"
                                                value={data.timezone}
                                                onChange={(e) => setData('timezone', e.target.value)}
                                            />
                                            <InputError message={errors.timezone} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="counting" className="mt-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pecahan Uang & Konfirmasi Hitung</CardTitle>
                                    <CardDescription>
                                        Atur pecahan yang muncul di formulir hitung kolekte dan syarat jumlah saksi.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="denominations">Pecahan Uang (pisahkan dengan koma)</Label>
                                        <Input
                                            id="denominations"
                                            value={denomInput}
                                            onChange={(e) => handleDenomChange(e.target.value)}
                                            placeholder="100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Pecahan akan otomatis diurutkan dari terbesar ke terkecil.
                                        </p>
                                        <InputError message={errors.denominations} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="min_confirmations_service">Konfirmasi Ibadah *</Label>
                                            <Input
                                                id="min_confirmations_service"
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={data.min_confirmations_service}
                                                onChange={(e) => setData('min_confirmations_service', Number(e.target.value))}
                                                required
                                            />
                                            <InputError message={errors.min_confirmations_service} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="min_confirmations_event">Konfirmasi Acara *</Label>
                                            <Input
                                                id="min_confirmations_event"
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={data.min_confirmations_event}
                                                onChange={(e) => setData('min_confirmations_event', Number(e.target.value))}
                                                required
                                            />
                                            <InputError message={errors.min_confirmations_event} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="min_confirmations_general">Konfirmasi Umum *</Label>
                                            <Input
                                                id="min_confirmations_general"
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={data.min_confirmations_general}
                                                onChange={(e) => setData('min_confirmations_general', Number(e.target.value))}
                                                required
                                            />
                                            <InputError message={errors.min_confirmations_general} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="finance" className="mt-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Aturan Keuangan</CardTitle>
                                    <CardDescription>
                                        Batas persetujuan pengeluaran dan toleransi saldo kas/dana.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="expense_approval_threshold">
                                            Ambang Persetujuan Pengeluaran (Rupiah) *
                                        </Label>
                                        <MoneyInput id="expense_approval_threshold" value={data.expense_approval_threshold} onChange={(v) => setData('expense_approval_threshold', v)} required />
                                        <p className="text-xs text-muted-foreground">
                                            Pengeluaran di atas nominal ini ({formatRupiah(data.expense_approval_threshold)}) memerlukan persetujuan Majelis.
                                        </p>
                                        <InputError message={errors.expense_approval_threshold} />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="allow_negative_balance">Izinkan Saldo Minus</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Jika dinonaktifkan, pengeluaran yang membuat saldo dana atau rekening negatif akan ditolak.
                                            </p>
                                        </div>
                                        <Switch
                                            id="allow_negative_balance"
                                            checked={data.allow_negative_balance}
                                            onCheckedChange={(checked) => setData('allow_negative_balance', checked)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="public" className="mt-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Transparansi Publik</CardTitle>
                                    <CardDescription>
                                        Akses publik ke ringkasan keuangan gereja tanpa perlu masuk ke akun.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="public_page_enabled">Aktifkan Halaman Transparansi Publik</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Halaman publik hanya menampilkan agregat per kategori dan dana, tidak pernah menampilkan nama atau nominal per individu.
                                            </p>
                                        </div>
                                        <Switch
                                            id="public_page_enabled"
                                            checked={data.public_page_enabled}
                                            onCheckedChange={(checked) => setData('public_page_enabled', checked)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex items-center justify-end gap-3">
                        {recentlySuccessful && (
                            <span className="text-sm text-muted-foreground">Tersimpan.</span>
                        )}
                        <Button type="submit" disabled={processing}>
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
