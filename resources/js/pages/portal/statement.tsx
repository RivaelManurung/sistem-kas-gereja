import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, Printer, ShieldCheck } from 'lucide-react';

interface MemberInfo {
    id: number;
    member_number: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}

interface StatementDonation {
    id: number;
    receipt_number: string;
    date: string;
    amount: number;
    payment_method: string;
    category_name?: string | null;
    notes?: string | null;
}

interface CategorySummary {
    name: string;
    amount: number;
}

interface StatementProps {
    churchName: string;
    member: MemberInfo;
    year: number;
    donations: StatementDonation[];
    totalAmount: number;
    byCategory: CategorySummary[];
}

export default function AnnualStatement({
    churchName,
    member,
    year,
    donations = [],
    totalAmount = 0,
    byCategory = [],
}: StatementProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Portal Jemaat', href: '/portal' },
        { title: `Bukti Kontribusi ${year}`, href: `/portal/statement?year=${year}` },
    ];

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Bukti Kontribusi Persembahan Tahunan ${year} — ${member.name}`} />

            <div className="flex flex-1 flex-col items-center p-4 md:p-8">
                {/* Print Control Bar */}
                <div className="mb-6 flex w-full max-w-4xl items-center justify-between print:hidden">
                    <Link href="/portal">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                            <ArrowLeft className="size-4" />
                            Kembali ke Portal
                        </Button>
                    </Link>

                    <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                        <Printer className="size-4" />
                        Cetak Pernyataan Tahunan (Print)
                    </Button>
                </div>

                {/* Printable Document Sheet */}
                <div className="w-full max-w-4xl rounded-xl border border-border bg-card p-8 shadow-sm sm:p-12 print:border-none print:p-0 print:shadow-none">
                    {/* Official Letterhead (Kop Surat) */}
                    <div className="border-b-2 border-border pb-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Building2 className="size-7 text-primary" />
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                                {churchName}
                            </h2>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Departemen Keuangan & Pembukuan Kas Jemaat
                        </p>
                    </div>

                    <div className="my-6 text-center">
                        <h1 className="text-xl font-extrabold uppercase tracking-tight text-foreground sm:text-2xl">
                            SURAT KETERANGAN KONTRIBUSI PERSEMBAHAN TAHUNAN
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-muted-foreground">
                            Periode Tahun Takwim: {year}
                        </p>
                    </div>

                    {/* Member Information Box */}
                    <div className="my-6 rounded-lg border border-border bg-muted/60 p-4 text-xs">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <span className="text-muted-foreground">Nama Anggota:</span>{' '}
                                <strong className="text-foreground">{member.name}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Nomor Anggota:</span>{' '}
                                <span className="font-mono font-semibold text-foreground">
                                    {member.member_number}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">No. Telepon:</span>{' '}
                                <span className="text-foreground">{member.phone || '-'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Email:</span>{' '}
                                <span className="text-foreground">{member.email || '-'}</span>
                            </div>
                            {member.address && (
                                <div className="sm:col-span-2">
                                    <span className="text-muted-foreground">Alamat:</span>{' '}
                                    <span className="text-foreground">{member.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary by Category */}
                    {byCategory.length > 0 && (
                        <div className="my-6">
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Ringkasan per Pos Persembahan
                            </h3>
                            <div className="rounded-lg border border-border">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border bg-muted/60 text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 font-semibold">Pos / Kategori</th>
                                            <th className="px-3 py-2 text-right font-semibold">Akumulasi Kontribusi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {byCategory.map((cat) => (
                                            <tr key={cat.name}>
                                                <td className="px-3 py-2 font-medium text-foreground">
                                                    {cat.name}
                                                </td>
                                                <td className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                                                    {formatRupiah(cat.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Detailed Transaction Table */}
                    <div className="my-6">
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Rincian Transaksi Persembahan Tahun {year}
                        </h3>
                        <div className="rounded-lg border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-muted/60 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 font-semibold">Tanggal</th>
                                        <th className="px-3 py-2 font-semibold">No. Kwitansi</th>
                                        <th className="px-3 py-2 font-semibold">Kategori</th>
                                        <th className="px-3 py-2 font-semibold">Metode</th>
                                        <th className="px-3 py-2 text-right font-semibold">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {donations.map((d) => (
                                        <tr key={d.id}>
                                            <td className="px-3 py-2 text-muted-foreground">{formatDate(d.date)}</td>
                                            <td className="px-3 py-2 font-mono text-muted-foreground">
                                                {d.receipt_number}
                                            </td>
                                            <td className="px-3 py-2 text-foreground">
                                                {d.category_name ?? 'Umum'}
                                            </td>
                                            <td className="px-3 py-2 capitalize text-muted-foreground">
                                                {d.payment_method}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                                                {formatRupiah(d.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t-2 border-border bg-muted/60 font-bold">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-2.5 text-right uppercase text-muted-foreground">
                                            Total Kontribusi Tahun {year}:
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-sm tabular-nums text-foreground">
                                            {formatRupiah(totalAmount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Closing Note & Signatures */}
                    <div className="mt-8 border-t border-dashed border-border pt-6">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            Surat keterangan ini diterbitkan berdasarkan catatan resmi persembahan yang tercatat dalam sistem pembukuan
                            keuangan gereja dan diverifikasi oleh majelis perbendaharaan. Kiranya Tuhan senantiasa memberkati persembahan dan pelayanan jemaat.
                        </p>

                        <div className="mt-8 flex items-end justify-between text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck className="size-4 text-income" />
                                <span>Dokumen Sah Sistem Kas Gereja</span>
                            </div>

                            <div className="w-52 text-center">
                                <p className="text-muted-foreground">Terverifikasi oleh,</p>
                                <div className="my-8 font-semibold text-income">
                                    [ DITANDATANGANI ELEKTRONIK ]
                                </div>
                                <p className="font-bold text-foreground">Bendahara Gereja</p>
                                <p className="text-[11px] text-muted-foreground">{churchName}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
