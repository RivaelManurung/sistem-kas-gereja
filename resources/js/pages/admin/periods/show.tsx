import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import { LedgerEntriesTable, type LedgerEntryRow } from '@/components/app/ledger-entries-table';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateRange, formatDateTime } from '@/lib/date';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { useState } from 'react';

interface PeriodDetail {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    closed_at: string | null;
    closer: { id: number; name: string } | null;
}

export default function PeriodShow({
    period,
    openingBalances,
    totalIncome,
    totalExpense,
}: {
    period: PeriodDetail;
    openingBalances: LedgerEntryRow[];
    totalIncome: number;
    totalExpense: number;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Periode Akuntansi', href: route('admin.periods.index') },
        { title: period.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Periode ${period.name}`} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back={route('admin.periods.index')}
                    title={period.name}
                    description={formatDateRange(period.start_date, period.end_date)}
                    actions={
                        <>
                            {!period.is_closed && (
                                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Tutup periode
                                </Button>
                            )}
                        </>
                    }
                />

                <StatTiles
                    items={[
                        { label: 'Total pemasukan', value: formatRupiah(totalIncome), tone: 'income', hint: 'Tidak termasuk saldo awal' },
                        { label: 'Total pengeluaran', value: formatRupiah(totalExpense), tone: 'expense' },
                        { label: 'Selisih', value: formatRupiah(totalIncome - totalExpense) },
                    ]}
                />

                <DetailCard title="Informasi periode">
                    <DefinitionList
                        items={[
                            { label: 'Nama periode', value: period.name },
                            { label: 'Rentang tanggal', value: formatDateRange(period.start_date, period.end_date) },
                            {
                                label: 'Status pembukuan',
                                value: period.is_closed ? <Badge variant="destructive">Periode Ditutup</Badge> : <Badge className="border-income/30 bg-income/10 text-income">Periode Terbuka</Badge>,
                            },
                            { label: 'Ditutup oleh', value: period.closer?.name, hidden: !period.is_closed },
                            { label: 'Ditutup pada', value: period.closed_at ? formatDateTime(period.closed_at) : null, hidden: !period.is_closed },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Saldo awal" description="Saldo awal per rekening dan pos dana yang dicatat untuk periode ini." flush>
                    <LedgerEntriesTable entries={openingBalances} empty="Tidak ada saldo awal yang dicatat pada periode ini." />
                </DetailCard>

                <ConfirmDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    title={`Tutup periode ${period.name}?`}
                    description={`Setelah ditutup, sistem menolak seluruh transaksi baru pada ${formatDate(period.start_date)} s/d ${formatDate(period.end_date)}. Periode yang sudah ditutup terkunci permanen.`}
                    confirmLabel="Tutup periode"
                    destructive
                    onConfirm={() => {
                        setConfirmOpen(false);
                        router.post(route('admin.periods.close', period.id));
                    }}
                />
            </div>
        </AppLayout>
    );
}
