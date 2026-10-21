import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { RowActions } from '@/components/app/row-actions';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Power } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';

interface Option {
    id: number;
    value: string;
    label: string;
    sort_order: number;
    is_active: boolean;
    is_system: boolean;
}

interface Group {
    key: string;
    label: string;
    description: string;
    options: Option[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Opsi Dropdown', href: '/admin/options' }];

export default function OptionsIndex({ groups }: { groups: Group[] }) {
    const [editing, setEditing] = useState<{ group: Group; option: Option | null } | null>(null);
    const [toggling, setToggling] = useState<Option | null>(null);

    const form = useForm({ group: '', label: '', sort_order: 0 });

    const openForm = (group: Group, option: Option | null) => {
        form.clearErrors();
        form.setData({ group: group.key, label: option?.label ?? '', sort_order: option?.sort_order ?? group.options.length + 1 });
        setEditing({ group, option });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const done = { preserveScroll: true, onSuccess: () => setEditing(null) };
        if (editing?.option) form.put(route('admin.options.update', editing.option.id), done);
        else form.post(route('admin.options.store'), done);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Opsi Dropdown" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader title="Opsi Dropdown" description="Atur pilihan yang muncul di formulir. Opsi yang dinonaktifkan tidak muncul lagi, tetapi data lama tetap utuh." />

                {groups.map((group) => (
                    <Card key={group.key}>
                        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                            <div className="space-y-1">
                                <CardTitle>{group.label}</CardTitle>
                                <CardDescription>{group.description}</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => openForm(group, null)}>
                                <Plus className="size-4" />
                                Tambah opsi
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 md:p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-24">Urutan</TableHead>
                                        <TableHead>Nama opsi</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-12">
                                            <span className="sr-only">Aksi</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.options.map((option) => (
                                        <TableRow key={option.id}>
                                            <TableCell className="text-muted-foreground tabular-nums">{option.sort_order}</TableCell>
                                            <TableCell>
                                                <span className="font-medium">{option.label}</span>
                                                {option.is_system && (
                                                    <Badge variant="outline" className="ml-2">
                                                        Bawaan
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge active={option.is_active} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <RowActions
                                                    actions={[
                                                        { label: 'Ubah', icon: Pencil, onSelect: () => openForm(group, option) },
                                                        {
                                                            label: option.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                            icon: Power,
                                                            onSelect: () => setToggling(option),
                                                            destructive: option.is_active,
                                                            separated: true,
                                                        },
                                                    ]}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>{editing?.option ? 'Ubah opsi' : 'Tambah opsi'}</DialogTitle>
                            <DialogDescription>{editing?.group.label}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="option-label">Nama opsi</Label>
                            <Input id="option-label" value={form.data.label} onChange={(e) => form.setData('label', e.target.value)} autoFocus required />
                            <InputError message={form.errors.label} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="option-order">Urutan tampil</Label>
                            <Input
                                id="option-order"
                                inputMode="numeric"
                                value={form.data.sort_order}
                                onChange={(e) => form.setData('sort_order', Number(e.target.value.replace(/\D/g, '')) || 0)}
                                className="w-28 tabular-nums"
                            />
                            <InputError message={form.errors.sort_order} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={toggling !== null}
                onOpenChange={(open) => !open && setToggling(null)}
                title={toggling?.is_active ? `Nonaktifkan ${toggling?.label}?` : `Aktifkan ${toggling?.label}?`}
                description={
                    toggling?.is_active
                        ? 'Opsi ini tidak muncul lagi di formulir. Data lama yang memakainya tidak berubah.'
                        : 'Opsi ini muncul kembali di formulir.'
                }
                confirmLabel={toggling?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                destructive={toggling?.is_active}
                onConfirm={() => toggling && router.patch(route('admin.options.toggle', toggling.id), {}, { preserveScroll: true, onFinish: () => setToggling(null) })}
            />
        </AppLayout>
    );
}
