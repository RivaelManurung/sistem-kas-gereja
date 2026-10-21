import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import { LedgerEntriesTable, type LedgerEntryRow } from '@/components/app/ledger-entries-table';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface DepositDetail {
    id: number;
    deposit_date: string;
    amount: number;
    reference_number: string | null;
    proof_path: string | null;
    notes: string | null;
    status: string;
    from_account: { id: number; name: string };
    to_account: { id: number; name: string; bank_name?: string | null };
    creator: { id: number; name: string } | null;
}

export default function DepositShow({ deposit, ledgerEntries }: { deposit: DepositDetail; ledgerEntries: LedgerEntryRow[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Setoran Bank', href: route('deposits.index') },
        { title: `Setoran ${formatDate(deposit.deposit_date)}`, href: '#' },
    ];
    const proofName = deposit.proof_path ? (deposit.proof_path.split('/').pop() ?? deposit.proof_path) : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Setoran ${formatDate(deposit.deposit_date)}`} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('deposits.index')}
                    title={`${deposit.from_account.name} ke ${deposit.to_account.name}`}
                    description={`Setoran bank tanggal ${formatDate(deposit.deposit_date)}`}
                />

                <StatTiles items={[{ label: 'Nominal setoran', value: formatRupiah(deposit.amount) }]} />

                <DetailCard title="Informasi setoran">
                    <DefinitionList
                        items={[
                            { label: 'Tanggal setor', value: formatDate(deposit.deposit_date) },
                            { label: 'Dari rekening (kas)', value: deposit.from_account.name },
                            { label: 'Ke rekening (bank)', value: deposit.to_account.bank_name ? `${deposit.to_account.name} (${deposit.to_account.bank_name})` : deposit.to_account.name },
                            { label: 'Nominal', value: <span className="tabular-nums">{formatRupiah(deposit.amount)}</span> },
                            { label: 'No. referensi / slip', value: deposit.reference_number },
                            { label: 'Status', value: <Badge className="border-income/30 bg-income/10 text-income">Tercatat di Buku Besar</Badge> },
                            { label: 'Dicatat oleh', value: deposit.creator?.name },
                            { label: 'Bukti setoran', value: proofName },
                            { label: 'Catatan', value: deposit.notes },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Entri buku besar" description="Dua entri yang dihasilkan setoran ini: keluar dari kas dan masuk ke bank." flush>
                    <LedgerEntriesTable entries={ledgerEntries} />
                </DetailCard>
            </div>
        </AppLayout>
    );
}
