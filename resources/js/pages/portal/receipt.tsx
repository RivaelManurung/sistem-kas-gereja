import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, CheckCircle2, Printer, ShieldCheck } from 'lucide-react';

interface MemberInfo {
    id: number;
    member_number: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}

interface DonationDetail {
    id: number;
    receipt_number: string;
    amount: number;
    payment_method: string;
    date: string;
    notes?: string | null;
    category_name?: string | null;
}

interface ReceiptProps {
    churchName: string;
    member: MemberInfo;
    donation: DonationDetail;
}

export default function ReceiptView({ churchName, member, donation }: ReceiptProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Portal Jemaat', href: '/portal' },
        { title: `Bukti ${donation.receipt_number}`, href: `/portal/receipt/${donation.id}` },
    ];

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Bukti Penerimaan Persembahan — ${donation.receipt_number}`} />

            <div className="flex flex-1 flex-col items-center p-4 md:p-8">
                {/* Action Bar (hidden on print) */}
                <div className="mb-6 flex w-full max-w-2xl items-center justify-between print:hidden">
                    <Link href="/portal">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                            <ArrowLeft className="size-4" />
                            Kembali ke Portal
                        </Button>
                    </Link>

                    <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                        <Printer className="size-4" />
                        Cetak Bukti (Print)
                    </Button>
                </div>

                {/* Printable Receipt Card */}
                <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10 print:border-none print:p-0 print:shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Header Kop */}
                    <div className="border-b border-neutral-200 pb-6 text-center dark:border-neutral-800">
                        <div className="flex items-center justify-center gap-2">
                            <Building2 className="size-6 text-primary" />
                            <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                {churchName}
                            </h2>
                        </div>
                        <h1 className="mt-2 text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-100">
                            BUKTI PENERIMAAN PERSEMBAHAN
                        </h1>
                        <p className="mt-1 font-mono text-sm font-semibold text-neutral-500">
                            Nomor: {donation.receipt_number}
                        </p>
                    </div>

                    {/* Receipt Details */}
                    <div className="my-6 space-y-4 text-sm">
                        <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 py-2 dark:border-neutral-800">
                            <span className="text-neutral-500">Telah Diterima Dari</span>
                            <span className="col-span-2 font-semibold text-neutral-900 dark:text-neutral-100">
                                {member.name} ({member.member_number})
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 py-2 dark:border-neutral-800">
                            <span className="text-neutral-500">Tanggal Transaksi</span>
                            <span className="col-span-2 text-neutral-900 dark:text-neutral-100">{donation.date}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 py-2 dark:border-neutral-800">
                            <span className="text-neutral-500">Pos Persembahan</span>
                            <span className="col-span-2 font-medium text-neutral-900 dark:text-neutral-100">
                                {donation.category_name ?? 'Umum'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 py-2 dark:border-neutral-800">
                            <span className="text-neutral-500">Metode Pembayaran</span>
                            <span className="col-span-2 capitalize text-neutral-900 dark:text-neutral-100">
                                {donation.payment_method}
                            </span>
                        </div>

                        {donation.notes && (
                            <div className="grid grid-cols-3 gap-2 border-b border-neutral-100 py-2 dark:border-neutral-800">
                                <span className="text-neutral-500">Keterangan</span>
                                <span className="col-span-2 text-neutral-800 dark:text-neutral-200">
                                    {donation.notes}
                                </span>
                            </div>
                        )}

                        <div className="mt-6 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950/60">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold uppercase text-neutral-500">Jumlah Diterima:</span>
                                <span className="text-2xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
                                    {formatRupiah(donation.amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Verification & Signature Stamp */}
                    <div className="mt-8 border-t border-dashed border-neutral-200 pt-6 dark:border-neutral-800">
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Tercatat Resmi dalam Buku Besar Gereja</span>
                            </div>
                            <span>Dokumen Sah Elektronik</span>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <div className="w-48 text-center text-xs">
                                <p className="text-neutral-500">Bagian Keuangan / Bendahara</p>
                                <div className="my-6 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    [ TERVERIFIKASI ]
                                </div>
                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{churchName}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
