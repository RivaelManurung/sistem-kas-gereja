import { DatePicker } from '@/components/ui/date-picker';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Download, Printer } from 'lucide-react';
import { useState } from 'react';

interface BulletinProps {
    start_date: string;
    end_date: string;
    date_range: string;
    period_label: string;
    sessions_breakdown: Array<{
        session_name: string;
        category_name: string;
        amount: number;
    }>;
    incomes: Array<{
        category_id: number | null;
        category_name: string;
        total: number;
    }>;
    expenses: Array<{
        category_id: number | null;
        category_name: string;
        total: number;
    }>;
    total_income: number;
    total_expense: number;
    opening_balance: number;
    closing_balance: number;
    church: {
        name: string;
        address?: string;
        city?: string;
        phone?: string;
        email?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Laporan Keuangan', href: '/reports' },
    { title: 'Warta Jemaat Mingguan', href: '/reports/bulletin' },
];

export default function ReportsBulletin({
    start_date,
    end_date,
    date_range,
    period_label,
    sessions_breakdown,
    incomes,
    expenses,
    total_income,
    total_expense,
    opening_balance,
    closing_balance,
    church,
}: BulletinProps) {
    const [selectedDate, setSelectedDate] = useState(end_date);

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        router.get(route('reports.bulletin'), { date }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warta Keuangan Jemaat Mingguan" />

            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <div className="print:hidden">
                    <PageHeader
                        title="Warta Jemaat Mingguan"
                        description="Format 1-halaman ringkas persembahan dan kas mingguan gereja siap cetak untuk warta jemaat."
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <DatePicker className="h-9 w-44" value={selectedDate} onChange={handleDateChange} />
                                </div>
                                <Button variant="outline" onClick={() => window.print()}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Cetak Warta
                                </Button>
                                <Button asChild>
                                    <a href={route('reports.bulletin.pdf', { date: selectedDate })} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        Unduh PDF Warta
                                    </a>
                                </Button>
                            </div>
                        }
                    />
                </div>

                {/* Pratinjau warta: tampil penuh di layar, dicetak sebagai satu halaman */}
                <section className="flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">{church.name}</h2>
                        <p className="text-muted-foreground text-sm">
                            {church.address}
                            {church.city ? `, ${church.city}` : ''}
                        </p>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-sm font-medium">Laporan Keuangan &amp; Persembahan Jemaat</p>
                        <p className="text-muted-foreground text-sm">
                            {period_label} &middot; {date_range}
                        </p>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan kas">
                    {[
                        { label: 'Saldo awal minggu', value: formatRupiah(opening_balance), tone: '' },
                        { label: 'Pemasukan minggu ini', value: `+${formatRupiah(total_income)}`, tone: 'text-income' },
                        { label: 'Pengeluaran minggu ini', value: `-${formatRupiah(total_expense)}`, tone: 'text-expense' },
                        { label: 'Saldo akhir minggu', value: formatRupiah(closing_balance), tone: '' },
                    ].map((kpi) => (
                        <Card key={kpi.label}>
                            <CardContent className="space-y-1 p-5 md:p-5">
                                <p className="text-muted-foreground text-sm">{kpi.label}</p>
                                <p className={`text-2xl font-semibold tracking-tight tabular-nums ${kpi.tone}`}>{kpi.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <div className="grid items-start gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
                            <CardTitle>Penerimaan persembahan ibadah</CardTitle>
                            <span className="text-income text-sm font-semibold tabular-nums">{formatRupiah(total_income)}</span>
                        </CardHeader>
                        <CardContent className="p-0 md:p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ibadah</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions_breakdown.length > 0
                                        ? sessions_breakdown.map((item, idx) => (
                                              <TableRow key={idx}>
                                                  <TableCell>{item.session_name}</TableCell>
                                                  <TableCell className="text-muted-foreground">{item.category_name}</TableCell>
                                                  <TableCell className="text-right tabular-nums">{formatRupiah(item.amount)}</TableCell>
                                              </TableRow>
                                          ))
                                        : incomes.length > 0
                                          ? incomes.map((inc, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell colSpan={2}>{inc.category_name}</TableCell>
                                                    <TableCell className="text-right tabular-nums">{formatRupiah(inc.total)}</TableCell>
                                                </TableRow>
                                            ))
                                          : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                                                        Belum ada penerimaan pada minggu ini.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between space-y-0 border-b">
                            <CardTitle>Pengeluaran kas</CardTitle>
                            <span className="text-expense text-sm font-semibold tabular-nums">{formatRupiah(total_expense)}</span>
                        </CardHeader>
                        <CardContent className="p-0 md:p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Uraian / kategori</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length > 0 ? (
                                        expenses.map((exp, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{exp.category_name}</TableCell>
                                                <TableCell className="text-right tabular-nums">{formatRupiah(exp.total)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-muted-foreground py-8 text-center">
                                                Tidak ada pengeluaran kas pada minggu ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <p className="text-muted-foreground border-t pt-4 text-sm">
                    &ldquo;Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena paksaan, sebab Allah mengasihi orang yang
                    memberi dengan sukacita.&rdquo; &mdash; 2 Korintus 9:7. Majelis Jemaat dan Bendahara mengucapkan terima kasih atas partisipasi seluruh jemaat.
                </p>
            </div>
        </AppLayout>
    );
}
