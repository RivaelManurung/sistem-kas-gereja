import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useMemo } from 'react';

interface CategoryOption {
    id: number;
    name: string;
}

interface FundOption {
    id: number;
    name: string;
}

interface RuleItemForm {
    [key: string]: any;
    id?: number;
    fund_id: number;
    percentage: number;
    sort_order?: number;
}

interface AllocationRuleData {
    id: number;
    category_id: number;
    name: string;
    valid_from: string;
    is_active: boolean;
    items: RuleItemForm[];
}

interface AllocationFormData {
    [key: string]: any;
    category_id: string;
    name: string;
    valid_from: string;
    is_active: boolean;
    items: RuleItemForm[];
}

export default function AllocationForm({
    rule,
    categories,
    funds,
    today,
}: {
    rule: AllocationRuleData | null;
    categories: CategoryOption[];
    funds: FundOption[];
    today: string;
}) {
    const isEdit = rule !== null;

    const initialItems: RuleItemForm[] = useMemo(() => {
        if (rule && rule.items.length > 0) {
            return rule.items.map((item) => ({
                id: item.id,
                fund_id: item.fund_id,
                percentage: Number(item.percentage),
            }));
        }
        if (funds.length > 0) {
            return [
                {
                    fund_id: funds[0].id,
                    percentage: 100,
                },
            ];
        }
        return [];
    }, [rule, funds]);

    const { data, setData, post, put, transform, processing, errors } = useForm<AllocationFormData>({
        category_id: rule?.category_id ? String(rule.category_id) : (categories[0] ? String(categories[0].id) : ''),
        name: rule?.name ?? '',
        valid_from: rule?.valid_from ?? today,
        is_active: rule?.is_active ?? true,
        items: initialItems,
    });

    const totalPercentage = useMemo(() => {
        return data.items.reduce((acc, item) => acc + (Number(item.percentage) || 0), 0);
    }, [data.items]);

    const isTotalValid = Math.abs(totalPercentage - 100) < 0.01;

    const addItem = () => {
        if (funds.length === 0) return;
        setData('items', [
            ...data.items,
            {
                fund_id: funds[0].id,
                percentage: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, updates: Partial<RuleItemForm>) => {
        const next = [...data.items];
        next[index] = { ...next[index], ...updates };
        setData('items', next);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            category_id: Number(data.category_id),
            items: data.items.map((item, idx) => ({
                ...item,
                fund_id: Number(item.fund_id),
                percentage: Number(item.percentage),
                sort_order: idx + 1,
            })),
        }));

        if (isEdit) {
            put(route('admin.allocations.update', rule.id));
        } else {
            post(route('admin.allocations.store'));
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Aturan Alokasi Pos Dana', href: '/admin/allocations' },
        { title: isEdit ? 'Edit Aturan' : 'Tambah Aturan', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Aturan Alokasi' : 'Tambah Aturan Alokasi'} />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={isEdit ? 'Edit Aturan Alokasi' : 'Tambah Aturan Alokasi Pos Dana'}
                    description="Tentukan porsi persentase pembagian persembahan ke setiap pos dana."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Identitas Aturan</CardTitle>
                        <CardDescription>Pilih kategori persembahan dan tanggal efektif berlakunya aturan ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Kategori Persembahan</Label>
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

                                <div className="space-y-2">
                                    <Label htmlFor="valid_from">Berlaku Mulai Tanggal</Label>
                                    <DatePicker
                                        id="valid_from"
                                        value={formatDate(data.valid_from)}
                                        onChange={(v) => setData('valid_from', v)}
                                        required
                                    />
                                    <InputError message={errors.valid_from} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Aturan</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="cth. Alokasi Kolekte Raya SK Majelis 2026"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Aktifkan aturan ini</Label>
                            </div>

                            {/* Items List */}
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Daftar Pos Dana & Persentase</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                        <Plus className="mr-1 h-3.5 w-3.5" />
                                        Tambah Pos Dana
                                    </Button>
                                </div>
                                <InputError message={errors.items} />

                                <div className="space-y-2">
                                    {data.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20">
                                            <div className="flex-1">
                                                <Select
                                                    value={String(item.fund_id)}
                                                    onValueChange={(val) =>
                                                        updateItem(index, { fund_id: Number(val) })
                                                    }
                                                >
                                                    <SelectTrigger>
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
                                            </div>

                                            <div className="w-32 flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    max="100"
                                                    value={item.percentage || ''}
                                                    onChange={(e) =>
                                                        updateItem(index, { percentage: Number(e.target.value) || 0 })
                                                    }
                                                    placeholder="0"
                                                    required
                                                />
                                                <span className="text-sm font-semibold text-muted-foreground">%</span>
                                            </div>

                                            {data.items.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Total indicator */}
                                <div
                                    className={`flex items-center justify-between p-3 rounded-lg border text-sm font-semibold ${
                                        isTotalValid
                                            ? 'bg-income/10 text-income border-income/30'
                                            : 'bg-destructive/10 text-destructive border-destructive/30'
                                    }`}
                                >
                                    <span>Total Persentase:</span>
                                    <span className="font-mono text-base">{totalPercentage.toFixed(2)}% (Harus 100.00%)</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.allocations.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing || !isTotalValid}>
                                    Simpan Aturan
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
