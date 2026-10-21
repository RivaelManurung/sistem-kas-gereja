import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Banknote, Calculator, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useMemo } from 'react';

interface AccountOption {
    id: number;
    name: string;
    type: string;
}

interface CategoryOption {
    id: number;
    name: string;
}

interface SessionOption {
    id: number;
    name: string;
    date: string;
    schedule?: {
        default_category_ids?: number[];
    } | null;
}

interface LineItemForm {
    [key: string]: any;
    id?: number;
    category_id: number;
    is_cash: boolean;
    denomination_counts: Record<string, number>;
    amount: number;
    reference_number: string;
}

interface CountingFormData {
    [key: string]: any;
    type: string;
    service_session_id: number | null;
    account_id: number;
    date: string;
    notes: string;
    idempotency_key: string;
    lines: LineItemForm[];
}

interface SheetData {
    id: number;
    type: string;
    service_session_id: number | null;
    account_id: number;
    date: string;
    notes: string | null;
    lines: Array<{
        id: number;
        category_id: number;
        is_cash: boolean;
        denomination_counts: Record<string, number> | null;
        amount: number;
        reference_number: string | null;
    }>;
}

export default function CountingForm({
    sheet,
    session,
    type,
    accounts,
    categories,
    denominations,
    today,
}: {
    sheet: SheetData | null;
    session: SessionOption | null;
    type: 'service' | 'general' | 'event';
    accounts: AccountOption[];
    categories: CategoryOption[];
    denominations: number[];
    today: string;
}) {
    const isEdit = sheet !== null;

    // Generate initial lines
    const initialLines: LineItemForm[] = useMemo(() => {
        if (sheet && sheet.lines.length > 0) {
            return sheet.lines.map((l) => ({
                id: l.id,
                category_id: l.category_id,
                is_cash: l.is_cash,
                denomination_counts: l.denomination_counts ?? {},
                amount: l.amount,
                reference_number: l.reference_number ?? '',
            }));
        }

        // If session has default categories from schedule, use them
        const defaultCategoryIds = session?.schedule?.default_category_ids;
        if (defaultCategoryIds && defaultCategoryIds.length > 0) {
            return defaultCategoryIds.map((catId) => ({
                category_id: catId,
                is_cash: true,
                denomination_counts: {},
                amount: 0,
                reference_number: '',
            }));
        }

        // Fallback to first available category
        if (categories.length > 0) {
            return [
                {
                    category_id: categories[0].id,
                    is_cash: true,
                    denomination_counts: {},
                    amount: 0,
                    reference_number: '',
                },
            ];
        }

        return [];
    }, [sheet, session, categories]);

    const defaultAccount = accounts.find((a) => a.type === 'cash') ?? accounts[0];

    const { data, setData, post, put, processing, errors } = useForm<CountingFormData>({
        type: sheet?.type ?? type,
        service_session_id: sheet?.service_session_id ?? session?.id ?? null,
        account_id: sheet?.account_id ?? (defaultAccount ? defaultAccount.id : 0),
        date: sheet?.date ?? session?.date ?? today,
        notes: sheet?.notes ?? '',
        idempotency_key: isEdit ? '' : `cs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        lines: initialLines,
    });

    // Helper to calculate line amount
    const calculateLineSubtotal = (line: LineItemForm): number => {
        if (!line.is_cash) {
            return Number(line.amount || 0);
        }
        let sum = 0;
        for (const [denom, count] of Object.entries(line.denomination_counts)) {
            const d = Number(denom);
            const c = Number(count);
            if (!isNaN(d) && !isNaN(c) && c > 0) {
                sum += d * c;
            }
        }
        return sum;
    };

    // Calculate grand total live
    const grandTotal = useMemo(() => {
        return data.lines.reduce((acc, line) => acc + calculateLineSubtotal(line), 0);
    }, [data.lines]);

    const addLine = () => {
        if (categories.length === 0) return;
        setData('lines', [
            ...data.lines,
            {
                category_id: categories[0].id,
                is_cash: true,
                denomination_counts: {},
                amount: 0,
                reference_number: '',
            },
        ]);
    };

    const removeLine = (index: number) => {
        setData('lines', data.lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, updates: Partial<LineItemForm>) => {
        const next = [...data.lines];
        next[index] = { ...next[index], ...updates };
        setData('lines', next);
    };

    const setDenominationCount = (lineIndex: number, denom: number, count: number) => {
        const line = data.lines[lineIndex];
        const nextCounts = { ...line.denomination_counts };
        if (count <= 0) {
            delete nextCounts[String(denom)];
        } else {
            nextCounts[String(denom)] = count;
        }
        updateLine(lineIndex, { denomination_counts: nextCounts });
    };

    const incrementDenomination = (lineIndex: number, denom: number, delta: number) => {
        const line = data.lines[lineIndex];
        const current = line.denomination_counts[String(denom)] ?? 0;
        setDenominationCount(lineIndex, denom, Math.max(0, current + delta));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('counting.update', sheet.id));
        } else {
            post(route('counting.store'));
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Berita Acara Hitung', href: '/counting' },
        { title: isEdit ? `Edit BA-${String(sheet.id).padStart(5, '0')}` : 'Hitung Baru', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Berita Acara Hitung' : 'Penghitungan Kolekte / Kas Masuk'} />
            <form onSubmit={submit} className="space-y-6 p-4 max-w-4xl pb-24">
                <PageHeader
                    back={route('counting.index')}
                    title={isEdit ? `Edit Berita Acara Hitung` : `Penghitungan Kolekte & Penerimaan`}
                    description={
                        session
                            ? `Sesi Ibadah: ${session.name} (${formatDate(session.date)})`
                            : 'Pencatatan fisik uang persembahan tunai & transfer.'
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Berita Acara</CardTitle>
                        <CardDescription>Pilih rekening penerima dan tanggal penghitungan fisik.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="account_id">Rekening Penampung</Label>
                            <Select
                                value={String(data.account_id)}
                                onValueChange={(val) => setData('account_id', Number(val))}
                            >
                                <SelectTrigger id="account_id">
                                    <SelectValue placeholder="Pilih rekening..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((acc) => (
                                        <SelectItem key={acc.id} value={String(acc.id)}>
                                            {acc.name} ({acc.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.account_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Tanggal Hitung</Label>
                            <DatePicker
                                id="date"
                                value={formatDate(data.date)}
                                onChange={(v) => setData('date', v)}
                                required
                            />
                            <InputError message={errors.date} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan (Opsional)</Label>
                            <Input
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="cth. Cuaca hujan, kehadiran 250 orang..."
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </CardContent>
                </Card>

                {/* Lines of Count */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold tracking-tight">Rincian Per Pos Persembahan</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addLine}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pos Persembahan
                        </Button>
                    </div>

                    <InputError message={errors.lines} />

                    {data.lines.map((line, lineIndex) => {
                        const lineSubtotal = calculateLineSubtotal(line);
                        return (
                            <Card key={lineIndex} className="border-2">
                                <CardHeader className="bg-muted/30 pb-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="space-y-1 flex-1 max-w-xs">
                                                <Label>Pos Persembahan</Label>
                                                <Select
                                                    value={String(line.category_id)}
                                                    onValueChange={(val) =>
                                                        updateLine(lineIndex, { category_id: Number(val) })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih pos..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((c) => (
                                                            <SelectItem key={c.id} value={String(c.id)}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center space-x-2 pt-6">
                                                <Switch
                                                    id={`cash-mode-${lineIndex}`}
                                                    checked={line.is_cash}
                                                    onCheckedChange={(checked) =>
                                                        updateLine(lineIndex, { is_cash: checked })
                                                    }
                                                />
                                                <Label htmlFor={`cash-mode-${lineIndex}`} className="text-sm font-medium">
                                                    {line.is_cash ? 'Uang Tunai (Fisik)' : 'Non-Tunai / Transfer'}
                                                </Label>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground uppercase font-semibold">
                                                    Subtotal Pos
                                                </div>
                                                <div className="text-lg font-bold text-primary tabular-nums">
                                                    {formatRupiah(lineSubtotal)}
                                                </div>
                                            </div>
                                            {data.lines.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeLine(lineIndex)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-4">
                                    {line.is_cash ? (
                                        <div className="space-y-3">
                                            <div className="text-xs text-muted-foreground font-medium">
                                                Masukkan jumlah lembar/keping uang per pecahan:
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                                {denominations.map((denom) => {
                                                    const count = line.denomination_counts[String(denom)] ?? 0;
                                                    const denomTotal = denom * count;
                                                    return (
                                                        <div
                                                            key={denom}
                                                            className={`p-2.5 rounded-lg border text-center transition-colors ${
                                                                count > 0 ? 'bg-primary/5 border-primary/40' : 'bg-background'
                                                            }`}
                                                        >
                                                            <div className="font-bold text-xs sm:text-sm text-foreground">
                                                                {formatRupiah(denom)}
                                                            </div>
                                                            <div className="my-2 flex items-center justify-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Kurang ${formatRupiah(denom)}`}
                                                                    className="h-11 w-11 rounded-md bg-muted hover:bg-muted/80 text-foreground text-base font-bold active:scale-95 transition flex items-center justify-center"
                                                                    onClick={() => incrementDenomination(lineIndex, denom, -1)}
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    inputMode="numeric"
                                                                    min={0}
                                                                    className="w-16 h-11 text-center font-bold text-base tabular-nums border rounded-md bg-background focus:ring-2 focus:ring-primary"
                                                                    value={count === 0 ? '' : count}
                                                                    placeholder="0"
                                                                    onChange={(e) =>
                                                                        setDenominationCount(
                                                                            lineIndex,
                                                                            denom,
                                                                            Number(e.target.value) || 0
                                                                        )
                                                                    }
                                                                />
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Tambah ${formatRupiah(denom)}`}
                                                                    className="h-11 w-11 rounded-md bg-primary text-primary-foreground text-base font-bold active:scale-95 transition flex items-center justify-center"
                                                                    onClick={() => incrementDenomination(lineIndex, denom, 1)}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <div className="flex justify-center gap-1.5 mt-1.5">
                                                                <button
                                                                    type="button"
                                                                    className="h-7 px-2.5 rounded bg-muted hover:bg-muted/80 text-xs font-medium"
                                                                    onClick={() => incrementDenomination(lineIndex, denom, 5)}
                                                                >
                                                                    +5
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="h-7 px-2.5 rounded bg-muted hover:bg-muted/80 text-xs font-medium"
                                                                    onClick={() => incrementDenomination(lineIndex, denom, 10)}
                                                                >
                                                                    +10
                                                                </button>
                                                            </div>
                                                            <div className="text-[11px] font-mono text-muted-foreground mt-1 truncate">
                                                                = {formatRupiah(denomTotal)}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nominal Penerimaan Non-Tunai (Rp)</Label>
                                                <MoneyInput value={line.amount} onChange={(v) => updateLine(lineIndex, { amount: v })} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>No. Referensi / Mutasi Bank / QRIS</Label>
                                                <Input
                                                    value={line.reference_number}
                                                    placeholder="cth. TRF-BCA-9872134"
                                                    onChange={(e) =>
                                                        updateLine(lineIndex, { reference_number: e.target.value })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Floating Bottom Bar with Grand Total */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t p-4 shadow-lg">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase font-semibold">
                                    Total Berita Acara
                                </div>
                                <div className="text-xl sm:text-2xl font-black tracking-tight text-primary tabular-nums">
                                    {formatRupiah(grandTotal)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href={route('counting.index')}>Batal</Link>
                            </Button>
                            <Button type="submit" disabled={processing || grandTotal <= 0} size="lg">
                                <Calculator className="mr-2 h-4 w-4" />
                                {isEdit ? 'Simpan Perubahan' : 'Simpan Berita Acara'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
