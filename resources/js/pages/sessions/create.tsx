import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface ScheduleOption {
    id: number;
    name: string;
    day_of_week: number;
    time: string;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sesi Ibadah', href: '/sessions' },
    { title: 'Buka Sesi', href: '#' },
];

export default function SessionCreate({
    schedules,
    today,
}: {
    schedules: ScheduleOption[];
    today: string;
}) {
    const { data, setData, post, processing, errors } = useForm({
        service_schedule_id: (schedules[0]?.id ? String(schedules[0].id) : '') as string,
        name: schedules[0]?.name ?? '',
        date: today,
        notes: '',
    });

    const isCustom = data.service_schedule_id === 'custom' || schedules.length === 0;

    const handleScheduleChange = (val: string) => {
        if (val === 'custom') {
            setData((prev) => ({
                ...prev,
                service_schedule_id: 'custom',
                name: '',
            }));
        } else {
            const selected = schedules.find((s) => String(s.id) === val);
            setData((prev) => ({
                ...prev,
                service_schedule_id: val,
                name: selected?.name ?? '',
            }));
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const payload: {
            service_schedule_id?: number | null;
            name?: string;
            date: string;
            notes?: string;
        } = {
            date: data.date,
            notes: data.notes || undefined,
        };

        if (isCustom) {
            payload.service_schedule_id = null;
            payload.name = data.name;
        } else {
            payload.service_schedule_id = Number(data.service_schedule_id);
            payload.name = data.name;
        }

        post(route('sessions.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buka Sesi Ibadah" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('sessions.index')}
                    title="Buka Sesi Ibadah"
                    description="Mulai sesi ibadah baru untuk mencatat kehadiran dan berita acara penghitungan kolekte."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Detail Sesi</CardTitle>
                        <CardDescription>
                            Pilih jadwal ibadah terdaftar atau buat sesi insidental/khusus (pernikahan, pelepasan, dll).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="schedule">Jadwal Ibadah</Label>
                                <Select
                                    value={data.service_schedule_id}
                                    onValueChange={handleScheduleChange}
                                >
                                    <SelectTrigger id="schedule">
                                        <SelectValue placeholder="Pilih jadwal ibadah..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schedules.map((schedule) => (
                                            <SelectItem key={schedule.id} value={String(schedule.id)}>
                                                {schedule.name} ({dayNames[schedule.day_of_week]}, {schedule.time})
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="custom">-- Ibadah Khusus / Insidental --</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.service_schedule_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Ibadah</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="cth. Ibadah Raya 1, Ibadah Pemuda, Kebaktian Tutup Tahun"
                                    disabled={!isCustom}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Tanggal Pelaksanaan</Label>
                                <DatePicker
                                    id="date"
                                    value={formatDate(data.date)}
                                    onChange={(v) => setData('date', v)}
                                    required
                                />
                                <InputError message={errors.date} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="cth. Pelayan firman: Pdt. Yohanes, liturgis: Diaken Maria..."
                                    rows={3}
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" asChild>
                                    <Link href={route('sessions.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Buka Sesi
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
