import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftRight } from 'lucide-react';
import { FormEventHandler } from 'react';

interface FundOption {
    id: number;
    name: string;
}

interface AccountOption {
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pindah Dana', href: '/transfers' },
    { title: 'Ajukan Pindah Dana', href: '#' },
];

export default function TransfersCreate({
    funds,
    accounts,
    today,
}: {
    funds: FundOption[];
    accounts: AccountOption[];
    today: string;
}) {
    const { data, setData, post, processing, errors } = useForm<{
        from_fund_id: string;
        to_fund_id: string;
        account_id: string;
        amount: number;
        transfer_date: string;
        reason: string;
        notes: string;
        [key: string]: any;
    }>({
        from_fund_id: funds[0] ? String(funds[0].id) : '',
        to_fund_id: funds[1] ? String(funds[1].id) : (funds[0] ? String(funds[0].id) : ''),
        account_id: accounts[0] ? String(accounts[0].id) : '',
        amount: 0,
        transfer_date: today,
        reason: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('transfers.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajukan Pindah Dana Antar-Pos" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('transfers.index')}
                    title="Permohonan Pindah Dana Antar-Pos"
                    description="Pencatatan mutasi alokasi dana antar pos (mis. penutupan defisit Diakonia oleh Kas Umum)."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Rincian Pemindahan Dana</CardTitle>
                        <CardDescription>
                            Pilih pos dana asal, pos dana tujuan, dan masukkan alasan pemindahan yang jelas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Tanggal Pemindahan</Label>
                                <DatePicker
                                    id="date"
                                    value={data.transfer_date}
                                    onChange={(v) => setData('transfer_date', v)}
                                    required
                                />
                                <InputError message={errors.transfer_date} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="from_fund">Dari Pos Dana (Sumber)</Label>
                                    <Select
                                        value={data.from_fund_id}
                                        onValueChange={(val) => setData('from_fund_id', val)}
                                    >
                                        <SelectTrigger id="from_fund">
                                            <SelectValue placeholder="Pilih pos dana asal..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {funds.map((f) => (
                                                <SelectItem key={f.id} value={String(f.id)}>
                                                    {f.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.from_fund_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="to_fund">Ke Pos Dana (Tujuan)</Label>
                                    <Select
                                        value={data.to_fund_id}
                                        onValueChange={(val) => setData('to_fund_id', val)}
                                    >
                                        <SelectTrigger id="to_fund">
                                            <SelectValue placeholder="Pilih pos dana tujuan..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {funds.map((f) => (
                                                <SelectItem key={f.id} value={String(f.id)}>
                                                    {f.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.to_fund_id} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="account">Rekening Transaksi</Label>
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
                                <Label htmlFor="amount">Nominal Pemindahan (Rp)</Label>
                                <MoneyInput id="amount" value={data.amount} onChange={(v) => setData('amount', v)} required />
                                <InputError message={errors.amount} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Alasan Pemindahan Dana</Label>
                                <Textarea
                                    id="reason"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="cth. Penutupan kekurangan dana diakonia pengobatan jemaat..."
                                    rows={3}
                                    required
                                />
                                <InputError message={errors.reason} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="cth. Berdasarkan keputusan rapat majelis tanggal..."
                                    rows={2}
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('transfers.index')}>Batal</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        data.amount <= 0 ||
                                        !data.reason ||
                                        data.from_fund_id === data.to_fund_id
                                    }
                                >
                                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                                    Ajukan Pindah Dana
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
