import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { type FormEventHandler } from 'react';

interface CategoryRow {
    id: number;
    name: string;
    direction: 'in' | 'out';
    is_public: boolean;
    event_name: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Transparansi Publik', href: '/admin/transparansi' }];

export default function TransparencyEdit({ enabled, categories }: { enabled: boolean; categories: CategoryRow[] }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        enabled,
        public_category_ids: categories.filter((c) => c.is_public).map((c) => c.id),
    });

    const togglePublic = (id: number, checked: boolean) =>
        setData('public_category_ids', checked ? [...data.public_category_ids, id] : data.public_category_ids.filter((x) => x !== id));

    const setGroup = (ids: number[], checked: boolean) =>
        setData('public_category_ids', checked ? [...new Set([...data.public_category_ids, ...ids])] : data.public_category_ids.filter((x) => !ids.includes(x)));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.transparency.update'), { preserveScroll: true });
    };

    const groups = [
        { direction: 'in' as const, title: 'Penerimaan', description: 'Masuk ke total “Persembahan diterima” dan rincian asal persembahan.' },
        { direction: 'out' as const, title: 'Pengeluaran', description: 'Masuk ke total “Dipakai untuk pelayanan” dan rincian pemakaian dana.' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transparansi Publik" />
            <form onSubmit={submit} className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Transparansi Publik"
                    description="Atur laporan keuangan yang dibuka untuk jemaat tanpa perlu masuk. Halaman publik hanya menampilkan total per kategori dan dana, tidak pernah nama atau nominal per orang."
                    actions={
                        <Button variant="outline" asChild>
                            <a href={route('transparency.index')} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Lihat halaman publik
                            </a>
                        </Button>
                    }
                />

                <Card>
                    <CardContent className="flex items-center justify-between gap-6">
                        <div className="space-y-1">
                            <Label htmlFor="enabled">Halaman transparansi publik</Label>
                            <p className="text-muted-foreground text-sm">
                                {data.enabled ? 'Aktif. Siapa pun yang punya tautan dapat melihat laporan.' : 'Nonaktif. Pengunjung tautan publik akan melihat halaman tidak ditemukan.'}
                            </p>
                        </div>
                        <Switch id="enabled" checked={data.enabled} onCheckedChange={(checked) => setData('enabled', checked)} />
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {groups.map((group) => {
                        const rows = categories.filter((c) => c.direction === group.direction);
                        const ids = rows.map((c) => c.id);
                        const shown = ids.filter((id) => data.public_category_ids.includes(id)).length;

                        return (
                            <Card key={group.direction}>
                                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                                    <div className="space-y-1">
                                        <CardTitle>
                                            Kategori {group.title.toLowerCase()}{' '}
                                            <span className="text-muted-foreground text-sm font-normal tabular-nums">
                                                {shown}/{rows.length} tampil
                                            </span>
                                        </CardTitle>
                                        <CardDescription>{group.description}</CardDescription>
                                    </div>
                                    {rows.length > 0 && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setGroup(ids, shown < rows.length)}>
                                            {shown < rows.length ? 'Tampilkan semua' : 'Sembunyikan semua'}
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="divide-y p-0">
                                    {rows.length === 0 && <p className="text-muted-foreground px-6 py-4 text-sm">Belum ada kategori aktif.</p>}
                                    {rows.map((c) => (
                                        <label key={c.id} className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-6 py-3">
                                            <Checkbox
                                                checked={data.public_category_ids.includes(c.id)}
                                                onCheckedChange={(checked) => togglePublic(c.id, checked === true)}
                                            />
                                            <span className="flex-1 text-sm">{c.name}</span>
                                            {c.event_name && <Badge variant="outline">{c.event_name}</Badge>}
                                        </label>
                                    ))}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                <InputError message={errors.public_category_ids} />

                <div className="flex items-center justify-end gap-3">
                    {recentlySuccessful && <span className="text-muted-foreground text-sm">Tersimpan.</span>}
                    <Button type="submit" disabled={processing}>
                        Simpan Perubahan
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
