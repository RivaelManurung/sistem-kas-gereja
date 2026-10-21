import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaybeLinkRow } from '@/components/app/link-row';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Props {
    fund: { id: number; code: string; name: string; description: string | null; is_active: boolean };
    balance: number;
    perAccount: Array<{ id: number; code: string; name: string; balance: number }>;
    entries: Array<{ id: number; entry_date: string; description: string | null; direction: 'in' | 'out'; source_url: string | null; amount: number; account_name: string | null }>;
    rules: Array<{ id: number; rule_id: number; rule_name: string; category_name: string | null; percentage: number; valid_from: string; is_active: boolean }>;
}

export default function FundShow({ fund, balance, perAccount, entries, rules }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dana', href: '/admin/funds' },
        { title: fund.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={fund.name} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back="/admin/funds"
                    title={fund.name}
                    description={`Dana ${fund.code}`}
                    actions={
                        <Button asChild>
                            <Link href={route('admin.funds.edit', fund.id)}>Ubah</Link>
                        </Button>
                    }
                />

                <StatTiles items={[{ label: 'Saldo saat ini', value: formatRupiah(balance), tone: balance < 0 ? 'expense' : undefined }]} />

                <DetailCard title="Identitas">
                    <DefinitionList
                        columns={3}
                        items={[
                            { label: 'Kode', value: fund.code },
                            { label: 'Nama', value: fund.name },
                            { label: 'Status', value: <StatusBadge active={fund.is_active} /> },
                            { label: 'Deskripsi', value: fund.description },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Saldo per rekening" description="Posisi dana ini di setiap rekening." flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rekening</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {perAccount.map((a) => (
                                <MaybeLinkRow key={a.id} href={route('admin.accounts.show', a.id)}>
                                    <TableCell>
                                        {a.code} - {a.name}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatRupiah(a.balance)}</TableCell>
                                </MaybeLinkRow>
                            ))}
                            {perAccount.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-muted-foreground py-8 text-center">
                                        Belum ada transaksi pada dana ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DetailCard>

                <DetailCard title="Aturan alokasi masuk" description="Aturan pembagian persembahan yang mengarahkan uang ke dana ini." flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Aturan</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Berlaku mulai</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Persentase</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.map((r) => (
                                <MaybeLinkRow key={r.id} href={route('admin.allocations.show', r.id)}>
                                    <TableCell>
                                        <Link href={route('admin.allocations.show', r.rule_id)} className="font-medium underline-offset-4 hover:underline">
                                            {r.rule_name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{r.category_name ?? '-'}</TableCell>
                                    <TableCell>{formatDate(r.valid_from)}</TableCell>
                                    <TableCell>
                                        <StatusBadge active={r.is_active} />
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{r.percentage}%</TableCell>
                                </MaybeLinkRow>
                            ))}
                            {rules.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                                        Belum ada aturan alokasi yang mengarah ke dana ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DetailCard>

                <DetailCard title="Transaksi terakhir" description="15 catatan buku kas terbaru pada dana ini." flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead>Rekening</TableHead>
                                <TableHead className="text-right">Masuk</TableHead>
                                <TableHead className="text-right">Keluar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((e) => (
                                <MaybeLinkRow key={e.id} href={e.source_url}>
                                    <TableCell>{formatDate(e.entry_date)}</TableCell>
                                    <TableCell>{e.description ?? '-'}</TableCell>
                                    <TableCell>{e.account_name ?? '-'}</TableCell>
                                    <TableCell className="text-income text-right tabular-nums">{e.direction === 'in' ? formatRupiah(e.amount) : ''}</TableCell>
                                    <TableCell className="text-expense text-right tabular-nums">{e.direction === 'out' ? formatRupiah(e.amount) : ''}</TableCell>
                                </MaybeLinkRow>
                            ))}
                            {entries.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
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
