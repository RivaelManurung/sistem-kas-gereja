import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Option, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Power } from 'lucide-react';
import { useState } from 'react';

interface AttributeRow {
    id: number;
    entity_type: string;
    key: string;
    label: string;
    data_type: string;
    options: string[] | null;
    is_required: boolean;
    is_public: boolean;
    is_active: boolean;
    sort_order: number;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Atribut Kustom', href: '/admin/attributes' }];

const typeLabels: Record<string, string> = {
    text: 'Teks',
    number: 'Angka',
    date: 'Tanggal',
    boolean: 'Boolean (Switch)',
    select: 'Pilihan (Select)',
    file: 'Berkas',
};

export default function AttributesIndex({
    definitions,
    currentEntity,
    entityOptions,
}: {
    definitions: Paginated<AttributeRow>;
    currentEntity: string;
    entityOptions: Option[];
}) {
    const [target, setTarget] = useState<AttributeRow | null>(null);

    const confirmToggle = () => {
        if (!target) return;
        router.patch(route('admin.attributes.toggle', target.id), {}, { preserveScroll: true });
        setTarget(null);
    };

    const handleTabChange = (val: string) => {
        router.get(route('admin.attributes.index'), { entity_type: val }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Atribut Kustom" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Definisi Kolom Tambahan (EAV)"
                    description="Definisikan kolom formulir kustom bertipe untuk Jemaat, Kategori, Acara, dan entitas lainnya."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.attributes.create')}>Tambah Atribut</Link>
                        </Button>
                    }
                />

                <Tabs value={currentEntity} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="flex flex-wrap gap-1 h-auto p-1 max-w-2xl bg-muted">
                        {entityOptions.map((opt) => (
                            <TabsTrigger key={opt.value} value={opt.value}>
                                {opt.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Urutan</TableHead>
                            <TableHead>Kunci (Key)</TableHead>
                            <TableHead>Label Tampilan</TableHead>
                            <TableHead>Tipe Data</TableHead>
                            <TableHead>Wajib</TableHead>
                            <TableHead>Publik</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {definitions.data.map((def) => (
                            <LinkRow key={def.id} href={route('admin.attributes.show', def.id)}>
                                <TableCell className="font-mono text-muted-foreground">{def.sort_order}</TableCell>
                                <TableCell className="font-mono font-medium">{def.key}</TableCell>
                                <TableCell className="font-medium">{def.label}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{typeLabels[def.data_type] ?? def.data_type}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={def.is_required ? 'default' : 'secondary'}>
                                        {def.is_required ? 'Wajib' : 'Opsional'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={def.is_public ? 'outline' : 'secondary'}>
                                        {def.is_public ? 'Tampil' : 'Privat'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge active={def.is_active} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('admin.attributes.show', def.id) },
                                            { label: 'Ubah', icon: Pencil, href: route('admin.attributes.edit', def.id) },
                                            {
                                                label: def.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: Power,
                                                onSelect: () => setTarget(def),
                                                destructive: def.is_active,
                                                separated: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {definitions.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    Belum ada kolom kustom untuk entitas ini.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={definitions.links} />

                <ConfirmDialog
                    open={target !== null}
                    onOpenChange={(open) => !open && setTarget(null)}
                    title={target?.is_active ? 'Nonaktifkan atribut?' : 'Aktifkan atribut?'}
                    description={
                        target?.is_active
                            ? `${target?.label} tidak akan muncul lagi sebagai pilihan baru. Data lama tetap tersimpan dan bisa diaktifkan kembali.`
                            : `${target?.label} akan tersedia kembali sebagai pilihan.`
                    }
                    confirmLabel={target?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    destructive={target?.is_active}
                    onConfirm={confirmToggle}
                />
            </div>
        </AppLayout>
    );
}
