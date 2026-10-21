import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Props {
    definition: {
        id: number;
        key: string;
        label: string;
        entity_type: string;
        entity_label: string;
        data_type: string;
        data_type_label: string;
        options: string[] | null;
        is_required: boolean;
        is_public: boolean;
        is_active: boolean;
        sort_order: number;
        scope_event: { id: number; name: string } | null;
        values_count: number;
    };
}

export default function AttributeShow({ definition: d }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Atribut Kustom', href: '/admin/attributes' },
        { title: d.label, href: '#' },
    ];
    const options = d.data_type === 'select' ? (d.options ?? []) : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={d.label} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back="/admin/attributes"
                    title={d.label}
                    description={`Kolom tambahan untuk ${d.entity_label}`}
                    actions={
                        <Button asChild>
                            <Link href={route('admin.attributes.edit', d.id)}>Ubah</Link>
                        </Button>
                    }
                />

                <StatTiles
                    items={[
                        { label: 'Data terisi', value: d.values_count, hint: 'Jumlah record yang saat ini memiliki nilai untuk kolom ini' },
                        { label: 'Urutan tampil', value: d.sort_order },
                    ]}
                />

                <DetailCard title="Definisi kolom">
                    <DefinitionList
                        items={[
                            { label: 'Label', value: d.label },
                            { label: 'Kunci (key)', value: <span className="font-mono">{d.key}</span> },
                            { label: 'Entitas', value: d.entity_label },
                            { label: 'Tipe data', value: d.data_type_label },
                            { label: 'Wajib diisi', value: <Badge variant={d.is_required ? 'default' : 'secondary'}>{d.is_required ? 'Wajib' : 'Opsional'}</Badge> },
                            { label: 'Visibilitas', value: <Badge variant={d.is_public ? 'outline' : 'secondary'}>{d.is_public ? 'Tampil' : 'Privat'}</Badge> },
                            { label: 'Status', value: <StatusBadge active={d.is_active} /> },
                            { label: 'Lingkup acara', value: d.scope_event ? d.scope_event.name : 'Semua acara' },
                        ]}
                    />
                </DetailCard>

                {d.data_type === 'select' && (
                    <DetailCard title="Pilihan" description={`${options.length} pilihan tersedia pada isian ini.`}>
                        {options.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {options.map((o) => (
                                    <Badge key={o} variant="outline">
                                        {o}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Belum ada pilihan yang ditentukan.</p>
                        )}
                    </DetailCard>
                )}
            </div>
        </AppLayout>
    );
}
