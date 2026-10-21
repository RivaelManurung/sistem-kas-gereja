import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FileUp, Receipt } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface AccountOption {
    id: number;
    name: string;
}

interface FundOption {
    id: number;
    name: string;
}

interface CategoryOption {
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengeluaran Kas', href: '/expenses' },
    { title: 'Ajukan Pengeluaran', href: '#' },
];

export default function ExpensesCreate({
    accounts,
    funds,
    categories,
    today,
}: {
    accounts: AccountOption[];
    funds: FundOption[];
    categories: CategoryOption[];
    today: string;
}) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm<{
        payee: string;
        amount: number;
        date: string;
        account_id: string;
        fund_id: string;
        category_id: string;
        description: string;
        notes: string;
        proof: File | null;
        [key: string]: any;
    }>({
        payee: '',
        amount: 0,
        date: today,
        account_id: accounts[0] ? String(accounts[0].id) : '',
        fund_id: funds[0] ? String(funds[0].id) : '',
        category_id: categories[0] ? String(categories[0].id) : '',
        description: '',
        notes: '',
        proof: null,
    });

    const handleFileChange = (file: File | null) => {
        setData('proof', file);
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('expenses.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajukan Pengeluaran Kas" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('expenses.index')}
                    title="Formulir Pengajuan Pengeluaran Kas"
                    description="Setiap pengeluaran kas wajib menyertakan foto nota atau kuitansi fisik asli."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Rincian Pengeluaran</CardTitle>
                        <CardDescription>
                            Isi informasi penerima, nominal, pos dana pembebanan, dan unggah bukti nota.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Tanggal Pengeluaran</Label>
                                    <DatePicker
                                        id="date"
                                        value={formatDate(data.date)}
                                        onChange={(v) => setData('date', v)}
                                        required
                                    />
                                    <InputError message={errors.date} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payee">Penerima Uang / Kepada</Label>
                                    <Input
                                        id="payee"
                                        value={data.payee}
                                        onChange={(e) => setData('payee', e.target.value)}
                                        placeholder="cth. PLN, Toko Bangunan Berkat, Pdt. Markus"
                                        required
                                    />
                                    <InputError message={errors.payee} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="account">Rekening Pengeluaran</Label>
                                    <Select
                                        value={data.account_id}
                                        onValueChange={(val) => setData('account_id', val)}
                                    >
                                        <SelectTrigger id="account">
                                            <SelectValue placeholder="Pilih rekening..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((a) => (
                                                <SelectItem key={a.id} value={String(a.id)}>
                                                    {a.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.account_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fund">Beban Pos Dana</Label>
                                    <Select
                                        value={data.fund_id}
                                        onValueChange={(val) => setData('fund_id', val)}
                                    >
                                        <SelectTrigger id="fund">
                                            <SelectValue placeholder="Pilih pos dana..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {funds.map((f) => (
                                                <SelectItem key={f.id} value={String(f.id)}>
                                                    {f.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.fund_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Kategori Pengeluaran</Label>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(val) => setData('category_id', val)}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Pilih kategori..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category_id} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Nominal Pengeluaran (Rp)</Label>
                                <MoneyInput id="amount" value={data.amount} onChange={(v) => setData('amount', v)} required />
                                <InputError message={errors.amount} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="proof" className="flex items-center gap-1 font-semibold">
                                    <FileUp className="h-4 w-4" />
                                    Unggah Bukti Nota / Kuitansi Fisik (Wajib)
                                </Label>
                                <Input
                                    id="proof"
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Format: JPG, PNG, atau PDF. Maksimal 5 MB.
                                </p>
                                <InputError message={errors.proof} />

                                {previewUrl && (
                                    <div className="mt-2 border rounded-md p-2 bg-muted/20 inline-block">
                                        <p className="text-xs font-semibold mb-1 text-muted-foreground">Preview Bukti:</p>
                                        <img
                                            src={previewUrl}
                                            alt="Preview Nota"
                                            className="max-h-48 rounded object-contain"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Keterangan / Keperluan</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="cth. Pembayaran rekening listrik gedung gereja bulan Oktober 2026"
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="cth. Dititipkan melalui Diaken Andreas"
                                    rows={2}
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('expenses.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing || data.amount <= 0 || !data.proof}>
                                    <Receipt className="h-4 w-4 mr-2" />
                                    Ajukan Pengeluaran
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
