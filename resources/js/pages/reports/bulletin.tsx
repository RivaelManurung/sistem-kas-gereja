import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Download, Newspaper, Printer } from 'lucide-react';
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

            <div className="space-y-6 p-4">
                <div className="print:hidden">
                    <PageHeader
                        title="Warta Jemaat Mingguan"
                        description="Format 1-halaman ringkas persembahan dan kas mingguan gereja siap cetak untuk warta jemaat."
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" asChild>
                                    <Link href={route('reports.index')}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Kembali ke Laporan
                                    </Link>
                                </Button>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={selectedDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                    />
                                </div>
                                <Button variant="secondary" onClick={() => window.print()}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Cetak Warta
                                </Button>
                                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                    <a href={route('reports.bulletin.pdf', { date: selectedDate })} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        Unduh PDF Warta
                                    </a>
                                </Button>
                            </div>
                        }
                    />
                </div>

                {/* Printable Bulletin Preview Sheet */}
                <div className="mx-auto max-w-3xl">
                    <Card className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 shadow-md print:shadow-none print:border-none print:bg-white print:text-black">
                        <CardContent className="p-8 space-y-6">
                            {/* Kop Surat Header */}
                            <div className="border-b-2 border-slate-900 dark:border-slate-200 pb-3 flex justify-between items-center print:border-black">
                                <div>
                                    <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900 dark:text-white print:text-black">
                                        {church.name}
                                    </h1>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">
                                        {church.address} {church.city ? `• ${church.city}` : ''}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
                                    Warta Jemaat Mingguan<br />
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">{period_label}</span>
                                </div>
                            </div>

                            <div className="text-center space-y-0.5">
                                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white print:text-black">
                                    Laporan Keuangan &amp; Persembahan Jemaat
                                </h2>
                                <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">Periode: {date_range}</p>
                            </div>

                            {/* Section 1: Worship Collections */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 p-1.5 border-l-4 border-blue-600 text-slate-900 dark:text-slate-100 print:bg-slate-100 print:text-black">
                                    1. Penerimaan Persembahan Ibadah Mingguan
                                </h3>
                                <Table className="text-xs">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="h-8">Ibadah / Sesi</TableHead>
                                            <TableHead className="h-8">Kategori Persembahan</TableHead>
                                            <TableHead className="h-8 text-right">Jumlah (Rupiah)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions_breakdown.length > 0 ? (
                                            sessions_breakdown.map((item, idx) => (
                                                <TableRow key={idx} className="h-7">
                                                    <TableCell className="py-1.5">{item.session_name}</TableCell>
                                                    <TableCell className="py-1.5">{item.category_name}</TableCell>
                                                    <TableCell className="py-1.5 text-right tabular-nums">
                                                        {formatRupiah(item.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            incomes.map((inc, idx) => (
                                                <TableRow key={idx} className="h-7">
                                                    <TableCell colSpan={2} className="py-1.5">{inc.category_name}</TableCell>
                                                    <TableCell className="py-1.5 text-right tabular-nums">
                                                        {formatRupiah(inc.total)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        <TableRow className="font-bold bg-slate-50 h-8 border-t border-slate-300">
                                            <TableCell colSpan={2}>TOTAL PENERIMAAN MINGGU INI</TableCell>
                                            <TableCell className="text-right tabular-nums text-emerald-600">
                                                {formatRupiah(total_income)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Section 2: Weekly Expenses */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 p-1.5 border-l-4 border-rose-600 text-slate-900 dark:text-slate-100 print:bg-slate-100 print:text-black">
                                    2. Pengeluaran Kas Minggu Ini
                                </h3>
                                <Table className="text-xs">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="h-8" colSpan={2}>Uraian / Kategori Pengeluaran</TableHead>
                                            <TableHead className="h-8 text-right">Jumlah (Rupiah)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.length > 0 ? (
                                            expenses.map((exp, idx) => (
                                                <TableRow key={idx} className="h-7">
                                                    <TableCell colSpan={2} className="py-1.5">{exp.category_name}</TableCell>
                                                    <TableCell className="py-1.5 text-right tabular-nums text-rose-600 dark:text-rose-400">
                                                        {formatRupiah(exp.total)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow className="h-7">
                                                <TableCell colSpan={3} className="text-center py-2 text-muted-foreground italic">
                                                    Tidak ada pengeluaran kas pada minggu ini.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="font-bold bg-slate-50 dark:bg-slate-800/60 h-8 border-t border-slate-300 dark:border-slate-700">
                                            <TableCell colSpan={2}>TOTAL PENGELUARAN MINGGU INI</TableCell>
                                            <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">
                                                {formatRupiah(total_expense)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Section 3: Balance Summary */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 p-1.5 border-l-4 border-emerald-600 text-slate-900 dark:text-slate-100 print:bg-slate-100 print:text-black">
                                    3. Ringkasan Posisi Kas
                                </h3>
                                <div className="rounded border bg-slate-50/70 dark:bg-slate-800/50 dark:border-slate-700 p-3 text-xs">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Saldo Awal Minggu:</span>
                                            <span className="tabular-nums font-medium">{formatRupiah(opening_balance)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Pemasukan Minggu Ini:</span>
                                            <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">+{formatRupiah(total_income)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5 font-bold">
                                            <span>Saldo Kas Akhir Minggu:</span>
                                            <span className="tabular-nums text-slate-900 dark:text-white">{formatRupiah(closing_balance)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                                            <span className="text-slate-600 dark:text-slate-400">Pengeluaran Minggu Ini:</span>
                                            <span className="tabular-nums font-semibold text-rose-600 dark:text-rose-400">-{formatRupiah(total_expense)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bible Verse */}
                            <div className="rounded border border-dashed border-slate-300 dark:border-slate-700 p-2.5 text-center text-[11px] italic text-slate-600 dark:text-slate-400">
                                &ldquo;Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena paksaan, sebab Allah mengasihi orang yang memberi dengan sukacita.&rdquo; &mdash; 2 Korintus 9:7
                            </div>

                            <div className="text-center text-[10px] text-slate-500 pt-2 border-t">
                                Majelis Jemaat &amp; Bendahara mengucapkan terima kasih atas partisipasi dan persembahan seluruh jemaat.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
