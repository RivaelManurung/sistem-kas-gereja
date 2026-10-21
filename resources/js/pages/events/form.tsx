import DynamicFields from '@/components/dynamic-fields';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type EventItem, type EventStatus } from '@/types';
import { type AttributeDefinition } from '@/types/attributes';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function EventForm({
    event,
    attributeDefinitions = [],
    customAttributes = {},
}: {
    event?: EventItem | null;
    attributeDefinitions?: AttributeDefinition[];
    customAttributes?: Record<string, any>;
}) {
    const isEdit = Boolean(event);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Acara & Kepanitiaan', href: '/events' },
        ...(isEdit && event
            ? [
                  { title: event.name, href: `/events/${event.id}` },
                  { title: 'Edit', href: '#' },
              ]
            : [{ title: 'Buat Acara', href: '#' }]),
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name: event?.name ?? '',
        theme: event?.theme ?? '',
        start_date: event?.start_date ?? new Date().toISOString().split('T')[0],
        end_date: event?.end_date ?? '',
        status: (event?.status ?? 'planning') as EventStatus,
        target_budget: event?.target_budget ? String(event.target_budget) : '',
        description: event?.description ?? '',
        attributes: customAttributes ?? {},
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const payload = {
            ...data,
            target_budget: data.target_budget ? Number(data.target_budget) : 0,
            end_date: data.end_date || undefined,
        };

        if (isEdit && event) {
            put(route('events.update', event.id));
        } else {
            post(route('events.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? `Edit ${event?.name}` : 'Buat Acara Baru'} />
            <div className="space-y-6 p-4 max-w-3xl">
                <PageHeader
                    title={isEdit ? `Edit Acara: ${event?.name}` : 'Buat Acara Baru'}
                    description={
                        isEdit
                            ? 'Perbarui informasi agenda, status pelaksanaan, atau target anggaran acara.'
                            : 'Tambahkan agenda atau kepanitiaan baru. Sistem akan secara otomatis mengalokasikan Pos Dana khusus untuk acara ini.'
                    }
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={isEdit && event ? route('events.show', event.id) : route('events.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Link>
                        </Button>
                    }
                />

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pokok Acara</CardTitle>
                            <CardDescription>
                                Masukkan nama kegiatan, tema rohani, dan periode pelaksanaan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="name">
                                    Nama Acara <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: Paskah 2026, Retret Pemuda, HUT Gereja"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="theme">Tema Acara (Opsional)</Label>
                                <Input
                                    id="theme"
                                    placeholder="Contoh: Bertumbuh Bersama dalam Kasih Kristus"
                                    value={data.theme}
                                    onChange={(e) => setData('theme', e.target.value)}
                                />
                                <InputError message={errors.theme} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="start_date">
                                        Tanggal Mulai <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                    />
                                    <InputError message={errors.start_date} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="end_date">Tanggal Selesai (Opsional)</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="status">Status Pelaksanaan</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(val) => setData('status', val as EventStatus)}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="planning">Perencanaan</SelectItem>
                                            <SelectItem value="active">Berjalan</SelectItem>
                                            <SelectItem value="completed">Selesai</SelectItem>
                                            {isEdit && <SelectItem value="closed">Ditutup</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="target_budget">Target Anggaran (Rupiah)</Label>
                                    <Input
                                        id="target_budget"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={data.target_budget}
                                        onChange={(e) => setData('target_budget', e.target.value)}
                                    />
                                    <InputError message={errors.target_budget} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="description">Deskripsi & Catatan Acara</Label>
                                <Textarea
                                    id="description"
                                    rows={4}
                                    placeholder="Rincian kegiatan, tujuan kepanitiaan, atau catatan lainnya..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </CardContent>
                    </Card>

                    {attributeDefinitions.length > 0 && (
                        <DynamicFields
                            definitions={attributeDefinitions}
                            values={data.attributes}
                            errors={errors as Record<string, string>}
                            onChange={(key, val) =>
                                setData('attributes', {
                                    ...data.attributes,
                                    [key]: val,
                                })
                            }
                        />
                    )}

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={isEdit && event ? route('events.show', event.id) : route('events.index')}>
                                Batal
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Acara'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
