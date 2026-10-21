import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface AccountOption {
    id: number;
    name: string;
    type: string;
    bank_name?: string | null;
    account_number?: string | null;
}

interface DepositFormData {
    [key: string]: any;
    deposit_date: string;
    from_account_id: string;
    to_account_id: string;
    amount: number;
    reference_number: string;
    notes: string;
}

export default function DepositForm({
    cashAccounts,
    bankAccounts,
    today,
}: {
    cashAccounts: AccountOption[];
    bankAccounts: AccountOption[];
    today: string;
}) {
    const { data, setData, post, transform, processing, errors } = useForm<DepositFormData>({
        deposit_date: today,
        from_account_id: cashAccounts[0] ? String(cashAccounts[0].id) : '',
        to_account_id: bankAccounts[0] ? String(bankAccounts[0].id) : '',
        amount: 0,
        reference_number: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            from_account_id: Number(data.from_account_id),
            to_account_id: Number(data.to_account_id),
            amount: Number(data.amount),
        }));

        post(route('deposits.store'));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Setoran Bank', href: '/deposits' },
        { title: 'Catat Setoran', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catat Setoran Bank" />
            <div className="space-y-6 p-4 max-w-2xl">
                <PageHeader
                    title="Catat Setoran Kas Tunai ke Bank"
                    description="Pencatatan mutasi penyetoran uang fisik kas gereja ke rekening bank."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Rincian Penyetoran</CardTitle>
                        <CardDescription>
                            Pilih rekening sumber uang tunai dan rekening bank penerima.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="date">Tanggal Setor</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.deposit_date}
                                    onChange={(e) => setData('deposit_date', e.target.value)}
                                    required
                                />
                                <InputError message={errors.deposit_date} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="from">Dari Rekening (Kas Tunai)</Label>
                                    <Select
                                        value={data.from_account_id}
                                        onValueChange={(val) => setData('from_account_id', val)}
                                    >
                                        <SelectTrigger id="from">
                                            <SelectValue placeholder="Pilih kas tunai..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cashAccounts.map((a) => (
                                                <SelectItem key={a.id} value={String(a.id)}>
                                                    {a.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.from_account_id} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="to">Ke Rekening (Bank)</Label>
                                    <Select
                                        value={data.to_account_id}
                                        onValueChange={(val) => setData('to_account_id', val)}
                                    >
                                        <SelectTrigger id="to">
                                            <SelectValue placeholder="Pilih rekening bank..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bankAccounts.map((a) => (
                                                <SelectItem key={a.id} value={String(a.id)}>
                                                    {a.name} ({a.bank_name ?? 'Bank'} - {a.account_number})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.to_account_id} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="amount">Nominal Setoran (Rp)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    value={data.amount || ''}
                                    placeholder="0"
                                    onChange={(e) => setData('amount', Number(e.target.value) || 0)}
                                    required
                                />
                                {data.amount > 0 && (
                                    <p className="text-xs text-muted-foreground font-mono">
                                        Terbilang: {formatRupiah(data.amount)}
                                    </p>
                                )}
                                <InputError message={errors.amount} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="ref">No. Referensi / Slip Setor Bank (Opsional)</Label>
                                <Input
                                    id="ref"
                                    value={data.reference_number}
                                    onChange={(e) => setData('reference_number', e.target.value)}
                                    placeholder="cth. SLIP-BCA-8472910"
                                />
                                <InputError message={errors.reference_number} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="notes">Catatan (Opsional)</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="cth. Disetor oleh Diaken Markus ke BCA cabang Sudirman..."
                                    rows={3}
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('deposits.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing || data.amount <= 0}>
                                    Bukukan Setoran Bank
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
