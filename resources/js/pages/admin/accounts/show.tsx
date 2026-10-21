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
    account: {
        id: number;
        code: string;
        name: string;
        type: string;
        type_label: string;
        bank_name: string | null;
        account_number: string | null;
        is_active: boolean;
    };
    balance: number;
    perFund: Array<{ id: number; code: string; name: string; balance: number }>;
    entries: Array<{ id: number; entry_date: string; description: string | null; direction: 'in' | 'out'; amount: number; fund_name: string | null }>;
}

export default function AccountShow({ account, balance, perFund, entries }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Rekening', href: '/admin/accounts' },
        { title: account.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={account.name} />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title={account.name}
                    description={`Rekening ${account.code}`}
                    actions={
                        <Button asChild>
                            <Link href={route('admin.accounts.edit', account.id)}>Ubah</Link>
                        </Button>
                    }
                />

                <StatTiles items={[{ label: 'Saldo saat ini', value: formatRupiah(balance), tone: balance < 0 ? 'expense' : undefined }]} />

                <DetailCard title="Identitas">
                    <DefinitionList
                        columns={3}
                        items={[
                            { label: 'Kode', value: account.code },
                            { label: 'Nama', value: account.name },
                            { label: 'Jenis', value: <Badge variant="outline">{account.type_label}</Badge> },
                            { label: 'Nama bank', value: account.bank_name, hidden: account.type !== 'bank' },
                            { label: 'Nomor rekening', value: account.account_number, hidden: account.type !== 'bank' },
                            { label: 'Status', value: <StatusBadge active={account.is_active} /> },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Saldo per dana" description="Pembagian saldo rekening ini ke setiap pos dana." flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dana</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {perFund.map((f) => (
                                <TableRow key={f.id}>
                                    <TableCell>
                                        {f.code} - {f.name}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{formatRupiah(f.balance)}</TableCell>
                                </TableRow>
                            ))}
                            {perFund.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-muted-foreground py-8 text-center">
                                        Belum ada transaksi pada rekening ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DetailCard>

                <DetailCard title="Transaksi terakhir" description="15 catatan buku kas terbaru pada rekening ini." flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead>Dana</TableHead>
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
                                    <TableCell className="text-income text-right tabular-nums">{e.direction === 'in' ? formatRupiah(e.amount) : ''}</TableCell>
                                    <TableCell className="text-expense text-right tabular-nums">{e.direction === 'out' ? formatRupiah(e.amount) : ''}</TableCell>
                                </TableRow>
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
