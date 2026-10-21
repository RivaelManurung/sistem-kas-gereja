import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Props {
    category: {
        id: number;
        name: string;
        direction: 'in' | 'out';
        direction_label: string;
        default_fund: { id: number; code: string; name: string } | null;
        allows_named: boolean;
        is_public: boolean;
        is_active: boolean;
        sort_order: number;
    };
    totals: { year: number; all_time: number; year_label: string };
    entries: Array<{ id: number; entry_date: string; description: string | null; direction: 'in' | 'out'; amount: number; fund_name: string | null; account_name: string | null }>;
    rules: Array<{ id: number; name: string; valid_from: string; is_active: boolean; items: Array<{ id: number; fund_name: string | null; percentage: number }> }>;
    customFields: {
        definitions: Array<{ id: number; key: string; label: string; data_type: string }>;
        values: Record<string, string | boolean | number | null>;
    };
}

function customValue(type: string, value: string | boolean | number | null | undefined) {
    if (value === null || value === undefined || value === '') return null;
    if (type === 'boolean') return value ? 'Ya' : 'Tidak';
    if (type === 'date') return formatDate(String(value));
    if (type === 'file') return 'Berkas terlampir';
    return String(value);
}

export default function CategoryShow({ category, totals, entries, rules, customFields }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Kategori', href: `/admin/categories?direction=${category.direction}` },
        { title: category.name, href: '#' },
    ];
    const tone = category.direction === 'in' ? 'income' : 'expense';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={category.name} />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={category.name}
                    description={`Kategori ${category.direction_label.toLowerCase()}`}
                    actions={
                        <Button asChild>
                            <Link href={route('admin.categories.edit', category.id)}>Ubah</Link>
                        </Button>
                    }
                />

                <StatTiles
                    items={[
                        { label: `Total tahun ${totals.year_label}`, value: formatRupiah(totals.year), tone },
                        { label: 'Total sepanjang waktu', value: formatRupiah(totals.all_time), tone },
                    ]}
                />

                <DetailCard title="Identitas">
                    <DefinitionList
                        columns={3}
                        items={[
                            { label: 'Nama', value: category.name },
                            { label: 'Arah', value: <Badge variant="outline">{category.direction_label}</Badge> },
                            { label: 'Dana bawaan', value: category.default_fund ? `${category.default_fund.code} - ${category.default_fund.name}` : null },
                            { label: 'Boleh atas nama', value: category.allows_named ? 'Ya' : 'Tidak', hidden: category.direction !== 'in' },
                            { label: 'Tampil di publik', value: category.is_public ? 'Tampil' : 'Disembunyikan' },
                            { label: 'Status', value: <StatusBadge active={category.is_active} /> },
                            { label: 'Urutan', value: category.sort_order },
                        ]}
                    />
                </DetailCard>

                {customFields.definitions.length > 0 && (
                    <DetailCard title="Data tambahan">
                        <DefinitionList
                            columns={3}
                            items={customFields.definitions.map((d) => ({ label: d.label, value: customValue(d.data_type, customFields.values[d.key]) }))}
                        />
                    </DetailCard>
                )}

                {category.direction === 'in' && (
                    <DetailCard title="Aturan alokasi" description="Pembagian persembahan kategori ini ke pos dana.">
                        {rules.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Belum ada aturan alokasi untuk kategori ini.</p>
                        ) : (
                            <ul className="divide-border divide-y">
                                {rules.map((r) => (
                                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                                        <div>
                                            <Link href={route('admin.allocations.show', r.id)} className="text-sm font-medium underline-offset-4 hover:underline">
                                                {r.name}
                                            </Link>
                                            <p className="text-muted-foreground text-xs">
                                                Berlaku mulai {formatDate(r.valid_from)}
                                                {r.items.length > 0 && ` - ${r.items.map((i) => `${i.fund_name}: ${i.percentage}%`).join(', ')}`}
                                            </p>
                                        </div>
                                        <StatusBadge active={r.is_active} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DetailCard>
                )}

                <DetailCard title="Transaksi terakhir" description="15 catatan buku kas terbaru pada kategori ini." flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead>Dana</TableHead>
                                <TableHead>Rekening</TableHead>
                                <TableHead className="text-right">Masuk</TableHead>
                                <TableHead className="text-right">Keluar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((e) => (
                                <TableRow key={e.id}>
                                    <TableCell>{formatDate(e.entry_date)}</TableCell>
                                    <TableCell>{e.description ?? '-'}</TableCell>
                                    <TableCell>{e.fund_name ?? '-'}</TableCell>
                                    <TableCell>{e.account_name ?? '-'}</TableCell>
                                    <TableCell className="text-income text-right tabular-nums">{e.direction === 'in' ? formatRupiah(e.amount) : ''}</TableCell>
                                    <TableCell className="text-expense text-right tabular-nums">{e.direction === 'out' ? formatRupiah(e.amount) : ''}</TableCell>
                                </TableRow>
                            ))}
                            {entries.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                                        Belum ada transaksi.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DetailCard>
            </div>
        </AppLayout>
    );
}
