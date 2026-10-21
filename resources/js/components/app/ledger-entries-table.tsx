import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/date';
import { formatRupiah } from '@/lib/money';

export interface LedgerEntryRow {
    id: number;
    entry_date: string;
    direction: 'in' | 'out';
    amount: number;
    description?: string | null;
    account?: { id: number; name: string } | null;
    fund?: { id: number; name: string } | null;
}

/** Tabel entri buku besar yang dihasilkan oleh sebuah transaksi. Dipakai di dalam DetailCard `flush`. */
export function LedgerEntriesTable({ entries, empty = 'Belum ada entri buku besar.' }: { entries: LedgerEntryRow[]; empty?: string }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Rekening</TableHead>
                    <TableHead>Pos Dana</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Masuk</TableHead>
                    <TableHead className="text-right">Keluar</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {entries.map((e) => (
                    <TableRow key={e.id}>
                        <TableCell className="text-sm">{formatDate(e.entry_date)}</TableCell>
                        <TableCell>{e.account?.name ?? '-'}</TableCell>
                        <TableCell>{e.fund?.name ?? '-'}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs text-sm whitespace-normal">{e.description ?? '-'}</TableCell>
                        <TableCell className="text-income text-right tabular-nums">{e.direction === 'in' ? formatRupiah(e.amount) : ''}</TableCell>
                        <TableCell className="text-expense text-right tabular-nums">{e.direction === 'out' ? formatRupiah(e.amount) : ''}</TableCell>
                    </TableRow>
                ))}
                {entries.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                            {empty}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
