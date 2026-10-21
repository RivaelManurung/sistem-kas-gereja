import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface CategoryOption {
    id: number;
    name: string;
}

interface MemberOption {
    id: number;
    name: string;
    membership_number: string;
}

interface SheetOption {
    id: number;
    date: string;
    lines: Array<{
        category_id: number;
        amount: number;
        category: {
            id: number;
            name: string;
        };
    }>;
}

interface DonationFormData {
    [key: string]: any;
    count_sheet_id: number | null;
    member_id: string;
    donor_name: string;
    category_id: string;
    amount: number;
    payment_method: string;
    notes: string;
}

export default function DonationForm({
    sheet,
    categories,
    members,
    paymentMethods,
}: {
    sheet: SheetOption | null;
    categories: CategoryOption[];
    members: MemberOption[];
    paymentMethods: Array<{ value: string; label: string }>;
}) {
    // If sheet provided, filter categories to only those in the sheet
    const availableCategories = sheet
        ? categories.filter((c) => sheet.lines.some((l) => l.category_id === c.id))
        : categories;

    const { data, setData, post, transform, processing, errors } = useForm<DonationFormData>({
        count_sheet_id: sheet?.id ?? null,
        member_id: '',
        donor_name: '',
        category_id: availableCategories[0] ? String(availableCategories[0].id) : '',
        amount: 0,
        payment_method: paymentMethods[0]?.value ?? '',
        notes: '',
    });

    const isGuest = data.member_id === 'guest';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            member_id: isGuest || !data.member_id ? null : Number(data.member_id),
            category_id: Number(data.category_id),
            amount: Number(data.amount),
        }));

        post(route('donations.store'));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Persembahan Atas Nama', href: '/donations' },
        { title: 'Catat Persembahan', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catat Persembahan Atas Nama" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={sheet ? route('counting.show', sheet.id) : route('donations.index')}
                    title="Catat Persembahan Atas Nama"
                    description={
                        sheet
                            ? `Terhubung dengan Berita Acara BA-${String(sheet.id).padStart(5, '0')} (${formatDate(sheet.date)})`
                            : 'Pencatatan persembahan perpuluhan, janji iman, atau ucapan syukur berkwitansi.'
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Data Donatur & Persembahan</CardTitle>
                        <CardDescription>
                            Pilih jemaat terdaftar dari basis data atau masukkan nama simpatisan/tamu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="member">Anggota Jemaat</Label>
                                <Select
                                    value={data.member_id}
                                    onValueChange={(val) => {
                                        setData('member_id', val);
                                        if (val !== 'guest') {
                                            const m = members.find((item) => String(item.id) === val);
                                            if (m) setData('donor_name', m.name);
                                        } else {
                                            setData('donor_name', '');
                                        }
                                    }}
                                >
                                    <SelectTrigger id="member">
                                        <SelectValue placeholder="Pilih anggota jemaat..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="guest">-- Tamu / Simpatisan / Luar Jemaat --</SelectItem>
                                        {members.map((m) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.name} ({m.membership_number})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.member_id} />
                            </div>

                            {isGuest && (
                                <div className="space-y-2">
                                    <Label htmlFor="donor_name">Nama Lengkap Donatur / Tamu</Label>
                                    <Input
                                        id="donor_name"
                                        value={data.donor_name}
                                        onChange={(e) => setData('donor_name', e.target.value)}
                                        placeholder="cth. Kel. Bapak Hendra (Jakarta)"
                                        required
                                    />
                                    <InputError message={errors.donor_name} />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="category">Pos Persembahan</Label>
                                <Select
                                    value={data.category_id}
                                    onValueChange={(val) => setData('category_id', val)}
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Pilih pos..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableCategories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.category_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Nominal Persembahan (Rp)</Label>
                                <MoneyInput id="amount" value={data.amount} onChange={(v) => setData('amount', v)} required />
                                <InputError message={errors.amount} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="method">Metode Pembayaran</Label>
                                <Select
                                    value={data.payment_method}
                                    onValueChange={(val) => setData('payment_method', val)}
                                >
                                    <SelectTrigger id="method">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.payment_method} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan / Doa Khusus (Opsional)</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="cth. Ucapan syukur ulang tahun pernikahan ke-25..."
                                    rows={3}
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link
                                        href={
                                            sheet ? route('counting.show', sheet.id) : route('donations.index')
                                        }
                                    >
                                        Batal
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing || data.amount <= 0}>
                                    Simpan & Buat Tanda Terima
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
