import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Option, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

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
    const toggle = (attr: AttributeRow) => {
        const verb = attr.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${verb} atribut ${attr.label}?`)) {
            router.patch(route('admin.attributes.toggle', attr.id), {}, { preserveScroll: true });
        }
    };

    const handleTabChange = (val: string) => {
        router.get(route('admin.attributes.index'), { entity_type: val }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Atribut Kustom" />
            <div className="space-y-6 p-4">
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
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {definitions.data.map((def) => (
                            <TableRow key={def.id}>
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
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={route('admin.attributes.edit', def.id)}>Edit</Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggle(def)}>
                                        {def.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    </Button>
                                </TableCell>
                            </TableRow>
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
            </div>
        </AppLayout>
    );
}
