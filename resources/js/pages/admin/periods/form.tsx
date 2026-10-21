import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface AccountOption {
    id: number;
    name: string;
}

interface FundOption {
    id: number;
    name: string;
}

interface OpeningBalanceLine {
    account_id: number;
    fund_id: number;
    amount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administrasi', href: '/admin/settings' },
    { title: 'Periode Akuntansi', href: '/admin/periods' },
    { title: 'Buat Periode', href: '#' },
];

export default function PeriodsForm({
    accounts,
    funds,
    today,
}: {
    accounts: AccountOption[];
    funds: FundOption[];
    today: string;
}) {
    const [openingBalances, setOpeningBalances] = useState<OpeningBalanceLine[]>([]);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        start_date: string;
        end_date: string;
        close_immediately: boolean;
        opening_balances: OpeningBalanceLine[];
        [key: string]: any;
    }>({
        name: '',
        start_date: today,
        end_date: today,
        close_immediately: false,
        opening_balances: [],
    });

    const addOpeningBalanceLine = () => {
        if (accounts.length === 0 || funds.length === 0) return;
        const updated = [
            ...openingBalances,
            {
                account_id: accounts[0].id,
                fund_id: funds[0].id,
                amount: 0,
            },
        ];
        setOpeningBalances(updated);
        setData('opening_balances', updated);
    };

    const removeOpeningBalanceLine = (index: number) => {
        const updated = openingBalances.filter((_, i) => i !== index);
        setOpeningBalances(updated);
        setData('opening_balances', updated);
    };

    const updateOpeningBalanceLine = (
        index: number,
        field: keyof OpeningBalanceLine,
        value: number
    ) => {
        const updated = [...openingBalances];
        updated[index] = { ...updated[index], [field]: value };
        setOpeningBalances(updated);
        setData('opening_balances', updated);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.periods.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Periode Akuntansi & Saldo Awal" />
            <div className="space-y-6 p-4 max-w-3xl">
                <PageHeader
                    title="Buat Periode Akuntansi Baru"
                    description="Menentukan rentang periode akuntansi buku kas dan opsional mencatat saldo awal pembuka."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Rentang Periode Pembukuan</CardTitle>
                        <CardDescription>
                            Tentukan tanggal awal dan akhir untuk periode ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-1">
                                <Label htmlFor="name">Nama Periode</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="cth. Tahun Buku 2026, Periode Pembuka Kas, Januari 2026"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="start_date">Tanggal Mulai</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.start_date} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="end_date">Tanggal Selesai</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-sm">Pencatatan Saldo Awal (Opsional)</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Catat saldo awal per pos dana dan rekening pada tanggal mulai periode ini.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addOpeningBalanceLine}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Tambah Saldo Awal
                                    </Button>
                                </div>

                                {openingBalances.length > 0 && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Rekening</TableHead>
                                                <TableHead>Pos Dana</TableHead>
                                                <TableHead className="w-48 text-right">Nominal Saldo (Rp)</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {openingBalances.map((line, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <select
                                                            className="w-full text-xs p-2 border rounded-md bg-background"
                                                            value={line.account_id}
                                                            onChange={(e) =>
                                                                updateOpeningBalanceLine(
                                                                    idx,
                                                                    'account_id',
                                                                    Number(e.target.value)
                                                                )
                                                            }
                                                        >
                                                            {accounts.map((a) => (
                                                                <option key={a.id} value={a.id}>
                                                                    {a.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <select
                                                            className="w-full text-xs p-2 border rounded-md bg-background"
                                                            value={line.fund_id}
                                                            onChange={(e) =>
                                                                updateOpeningBalanceLine(
                                                                    idx,
                                                                    'fund_id',
                                                                    Number(e.target.value)
                                                                )
                                                            }
                                                        >
                                                            {funds.map((f) => (
                                                                <option key={f.id} value={f.id}>
                                                                    {f.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Input
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={0}
                                                            className="text-right font-mono"
                                                            value={line.amount || ''}
                                                            placeholder="0"
                                                            onChange={(e) =>
                                                                updateOpeningBalanceLine(
                                                                    idx,
                                                                    'amount',
                                                                    Number(e.target.value) || 0
                                                                )
                                                            }
                                                        />
                                                        {line.amount > 0 && (
                                                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                                {formatRupiah(line.amount)}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive h-8 w-8"
                                                            onClick={() => removeOpeningBalanceLine(idx)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="close_immediately"
                                        checked={data.close_immediately}
                                        onCheckedChange={(checked) =>
                                            setData('close_immediately', Boolean(checked))
                                        }
                                    />
                                    <Label
                                        htmlFor="close_immediately"
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        Langsung tutup periode ini setelah disimpan (khusus Periode Pembuka Saldo Awal)
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground ml-6 mt-1">
                                    Sesuai aturan spec §8.9: Saldo awal dimasukkan di periode pembuka yang langsung ditutup.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.periods.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing || !data.name}>
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    Simpan Periode Akuntansi
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
