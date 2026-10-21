import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface CategoryOption {
    id: number;
    name: string;
}

interface ScheduleData {
    id: number;
    name: string;
    day_of_week: number;
    time: string;
    default_category_ids: number[];
    is_active: boolean;
}

const days = [
    { value: '0', label: 'Minggu' },
    { value: '1', label: 'Senin' },
    { value: '2', label: 'Selasa' },
    { value: '3', label: 'Rabu' },
    { value: '4', label: 'Kamis' },
    { value: '5', label: 'Jumat' },
    { value: '6', label: 'Sabtu' },
];

export default function ScheduleForm({
    schedule,
    categories,
}: {
    schedule: ScheduleData | null;
    categories: CategoryOption[];
}) {
    const isEdit = schedule !== null;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jadwal Ibadah', href: '/admin/schedules' },
        { title: isEdit ? 'Edit Jadwal' : 'Tambah Jadwal', href: '#' },
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name: schedule?.name ?? '',
        day_of_week: schedule?.day_of_week !== undefined ? String(schedule.day_of_week) : '0',
        time: schedule?.time ?? '09:00',
        default_category_ids: schedule?.default_category_ids ?? [],
        is_active: schedule?.is_active ?? true,
    });

    const toggleCategory = (id: number) => {
        const current = data.default_category_ids;
        if (current.includes(id)) {
            setData('default_category_ids', current.filter((item) => item !== id));
        } else {
            setData('default_category_ids', [...current, id]);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const payload = {
            ...data,
            day_of_week: Number(data.day_of_week),
        };

        if (isEdit) {
            put(route('admin.schedules.update', schedule.id));
        } else {
            post(route('admin.schedules.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Jadwal' : 'Tambah Jadwal'} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('admin.schedules.index')}
                    title={isEdit ? 'Edit Jadwal' : 'Tambah Jadwal Ibadah'}
                    description={
                        isEdit ? `Perbarui jadwal ${schedule.name}` : 'Tambahkan template jadwal ibadah rutin mingguan.'
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Data Jadwal</CardTitle>
                        <CardDescription>Pilih hari, jam ibadah, dan kategori persembahan yang lazim diedarkan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Ibadah *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Ibadah Raya 1, Ibadah Pemuda"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="day_of_week">Hari *</Label>
                                    <Select
                                        value={data.day_of_week}
                                        onValueChange={(val) => setData('day_of_week', val)}
                                    >
                                        <SelectTrigger id="day_of_week">
                                            <SelectValue placeholder="Pilih hari" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {days.map((d) => (
                                                <SelectItem key={d.value} value={d.value}>
                                                    {d.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.day_of_week} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="time">Jam Ibadah *</Label>
                                    <Input
                                        id="time"
                                        value={data.time}
                                        onChange={(e) => setData('time', e.target.value)}
                                        placeholder="08:00"
                                        required
                                    />
                                    <InputError message={errors.time} />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Kategori Persembahan Bawaan</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-4">
                                    {categories.map((cat) => (
                                        <div key={cat.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`cat_${cat.id}`}
                                                checked={data.default_category_ids.includes(cat.id)}
                                                onCheckedChange={() => toggleCategory(cat.id)}
                                            />
                                            <label
                                                htmlFor={`cat_${cat.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {cat.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Kategori yang dipilih akan otomatis muncul di form hitung saat sesi dibuka.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('admin.schedules.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {isEdit ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
