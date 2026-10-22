import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
    place_date: string;
    sessions_breakdown: Array<{ session_name: string; category_name: string; amount: number }>;
    incomes: Array<{ category_id: number | null; category_name: string; total: number }>;
    expenses: Array<{ category_id: number | null; category_name: string; total: number }>;
    total_income: number;
    total_expense: number;
    opening_balance: number;
    closing_balance: number;
    signatories: Array<{ title: string; position: string; name: string }>;
    church: { name: string; address?: string | null; city?: string | null; phone?: string | null; email?: string | null; logo_url?: string | null };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Laporan Keuangan', href: '/reports' },
    { title: 'Warta Jemaat Mingguan', href: '/reports/bulletin' },
];

const serif = { fontFamily: '"Times New Roman", Times, serif' };

/** Hairline table used on the paper sheet; mirrors the PDF template so preview, print and PDF match. */
function PaperTable({ head, children }: { head: string[]; children: React.ReactNode }) {
    return (
        <table className="w-full border-collapse text-[10.5pt]">
            <thead>
                <tr>
                    {head.map((h, i) => (
                        <th key={h} className={`border-y border-black px-1.5 py-1 text-[10pt] font-bold ${i === head.length - 1 ? 'text-right' : 'text-left'}`}>
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
}

const Money = ({ value, negative }: { value: number; negative?: boolean }) => <span className="whitespace-nowrap tabular-nums">{negative ? `(${formatRupiah(value)})` : formatRupiah(value)}</span>;

export default function ReportsBulletin({
    end_date,
    date_range,
    period_label,
    place_date,
    sessions_breakdown,
    incomes,
    expenses,
    total_income,
    total_expense,
    opening_balance,
    closing_balance,
    signatories,
    church,
}: BulletinProps) {
    const [selectedDate, setSelectedDate] = useState(end_date);

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        router.get(route('reports.bulletin'), { date }, { preserveState: true });
    };

    const detailed = sessions_breakdown.length > 0 && sessions_breakdown.length <= 8;
    const incomeRows = incomes.filter((row) => row.total > 0);
    const expenseRows = expenses.filter((row) => row.total > 0);
    const contact = [church.address, church.city].filter(Boolean).join(', ');
    const reach = [church.phone ? `Telp. ${church.phone}` : null, church.email].filter(Boolean).join('  |  ');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warta Jemaat Mingguan" />

            <div className="space-y-6 p-4 md:p-6 lg:p-8 print:p-0">
                <div className="print:hidden">
                    <PageHeader
                        back="/reports"
                        title="Warta Jemaat Mingguan"
                        description="Laporan persembahan dan keuangan satu halaman untuk dibagikan kepada jemaat. Tampilan di bawah sama dengan hasil cetak dan PDF."
                        actions={
                            <>
                                <DatePicker className="h-9 w-44" value={selectedDate} onChange={handleDateChange} />
                                <Button variant="outline" onClick={() => window.print()}>
                                    <Printer className="size-4" />
                                    Cetak Warta
                                </Button>
                                <Button asChild>
                                    <a href={route('reports.bulletin.pdf', { date: selectedDate })} download>
                                        <Download className="size-4" />
                                        Unduh PDF Warta
                                    </a>
                                </Button>
                            </>
                        }
                    />
                </div>

                <div className="bg-muted/50 rounded-xl border p-3 sm:p-6 lg:p-10 print:border-0 print:bg-transparent print:p-0">
                    {/* A4 sheet: always black on white, whatever the app theme */}
                    <article
                        className="mx-auto w-full max-w-[794px] bg-white p-6 text-[10.5pt] leading-snug text-black shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none"
                        style={serif}
                    >
                        <header className="flex items-center gap-4 border-b-[3px] border-double border-black pb-2">
                            <div className="flex w-20 shrink-0 justify-center">{church.logo_url && <img src={church.logo_url} alt="" className="max-h-16 max-w-20 object-contain" />}</div>
                            <div className="flex-1 text-center">
                                <h2 className="text-[16pt] leading-tight font-bold tracking-wide uppercase">{church.name}</h2>
                                {contact && <p className="text-[9.5pt] text-neutral-700">{contact}</p>}
                                {reach && <p className="text-[9.5pt] text-neutral-700">{reach}</p>}
                            </div>
                            <div className="hidden w-20 shrink-0 sm:block" />
                        </header>

                        <div className="mt-3 mb-2 text-center">
                            <h1 className="text-[14pt] font-bold tracking-[0.3em] uppercase">Warta Jemaat</h1>
                            <p>Laporan Persembahan dan Keuangan Mingguan</p>
                            <p className="text-[10pt] text-neutral-700">
                                {period_label} &middot; Periode {date_range}
                            </p>
                        </div>

                        <p className="my-2 text-justify">
                            Shalom, Bapak/Ibu/Saudara jemaat yang dikasihi Tuhan. Berikut laporan persembahan dan keuangan gereja pada pekan ini, sebagai bentuk pertanggungjawaban kita bersama.
                        </p>

                        <h3 className="mt-3 mb-1 text-[10.5pt] font-bold tracking-wide uppercase">I. Persembahan yang Diterima</h3>
                        <PaperTable head={detailed ? ['Ibadah', 'Jenis Persembahan', 'Jumlah'] : ['Jenis Persembahan (seluruh ibadah pekan ini)', 'Jumlah']}>
                            {detailed
                                ? sessions_breakdown.map((row, i) => (
                                      <tr key={i} className="border-b border-neutral-400">
                                          <td className="px-1.5 py-0.5">{row.session_name}</td>
                                          <td className="px-1.5 py-0.5">{row.category_name}</td>
                                          <td className="px-1.5 py-0.5 text-right">
                                              <Money value={row.amount} />
                                          </td>
                                      </tr>
                                  ))
                                : incomeRows.map((row, i) => (
                                      <tr key={i} className="border-b border-neutral-400">
                                          <td className="px-1.5 py-0.5">{row.category_name}</td>
                                          <td className="px-1.5 py-0.5 text-right">
                                              <Money value={row.total} />
                                          </td>
                                      </tr>
                                  ))}
                            {(detailed ? sessions_breakdown.length : incomeRows.length) === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-1.5 py-2 text-center text-neutral-600 italic">
                                        Tidak ada persembahan tercatat pada pekan ini.
                                    </td>
                                </tr>
                            )}
                            <tr className="border-t border-b-[3px] border-t-black border-b-black font-bold [border-bottom-style:double]">
                                <td className="px-1.5 py-1" colSpan={detailed ? 2 : 1}>
                                    Jumlah penerimaan
                                </td>
                                <td className="px-1.5 py-1 text-right">
                                    <Money value={total_income} />
                                </td>
                            </tr>
                        </PaperTable>

                        <h3 className="mt-3 mb-1 text-[10.5pt] font-bold tracking-wide uppercase">II. Pengeluaran Kas</h3>
                        <PaperTable head={['Uraian', 'Jumlah']}>
                            {expenseRows.map((row, i) => (
                                <tr key={i} className="border-b border-neutral-400">
                                    <td className="px-1.5 py-0.5">{row.category_name}</td>
                                    <td className="px-1.5 py-0.5 text-right">
                                        <Money value={row.total} />
                                    </td>
                                </tr>
                            ))}
                            {expenseRows.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-1.5 py-2 text-center text-neutral-600 italic">
                                        Tidak ada pengeluaran kas pada pekan ini.
                                    </td>
                                </tr>
                            )}
                            <tr className="border-t border-b-[3px] border-t-black border-b-black font-bold [border-bottom-style:double]">
                                <td className="px-1.5 py-1">Jumlah pengeluaran</td>
                                <td className="px-1.5 py-1 text-right">
                                    <Money value={total_expense} />
                                </td>
                            </tr>
                        </PaperTable>

                        <h3 className="mt-3 mb-1 text-[10.5pt] font-bold tracking-wide uppercase">III. Ringkasan Kas</h3>
                        <table className="w-full border-collapse">
                            <tbody>
                                <tr>
                                    <td className="px-1.5 py-0.5">Saldo awal pekan</td>
                                    <td className="px-1.5 py-0.5 text-right">
                                        <Money value={opening_balance} />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-1.5 py-0.5">Penerimaan pekan ini</td>
                                    <td className="px-1.5 py-0.5 text-right">
                                        <Money value={total_income} />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-1.5 py-0.5">Pengeluaran pekan ini</td>
                                    <td className="px-1.5 py-0.5 text-right">
                                        <Money value={total_expense} negative />
                                    </td>
                                </tr>
                                <tr className="border-t border-b-[3px] border-t-black border-b-black font-bold [border-bottom-style:double]">
                                    <td className="px-1.5 py-1">Saldo kas akhir pekan</td>
                                    <td className="px-1.5 py-1 text-right">
                                        <Money value={closing_balance} />
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <blockquote className="mx-4 my-4 border-y border-neutral-500 px-3 py-1.5 text-center text-[10pt] italic sm:mx-6">
                            &ldquo;Hendaklah masing-masing memberikan menurut kerelaan hatinya, jangan dengan sedih hati atau karena paksaan, sebab Allah mengasihi orang yang memberi dengan sukacita.&rdquo; &mdash; 2 Korintus 9:7
                        </blockquote>

                        <p className="my-2 text-justify">Majelis Jemaat dan Bendahara mengucapkan terima kasih atas kesetiaan dan persembahan seluruh jemaat. Tuhan Yesus memberkati.</p>

                        {signatories.length > 0 && (
                            <section className="mt-3 break-inside-avoid">
                                <p className="text-right text-[10pt]">{place_date}</p>
                                <div className="mt-1 grid gap-4" style={{ gridTemplateColumns: `repeat(${signatories.length}, minmax(0, 1fr))` }}>
                                    {signatories.map((sig) => (
                                        <div key={sig.position} className="text-center text-[10pt]">
                                            <p>{sig.position}</p>
                                            <div className="h-14" />
                                            <p className="font-bold underline">{sig.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <footer className="mt-4 border-t border-neutral-400 pt-1 text-center text-[8pt] text-neutral-600">Warta ini dicetak dari sistem Kas Gereja</footer>
                    </article>
                </div>
            </div>
        </AppLayout>
    );
}
