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
                <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10 print:border-none print:p-0 print:shadow-none">
                    {/* Header Kop */}
                    <div className="border-b border-border pb-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Building2 className="size-6 text-primary" />
                            <h2 className="text-lg font-bold tracking-tight text-foreground">
                                {churchName}
                            </h2>
                        </div>
                        <h1 className="mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                            BUKTI PENERIMAAN PERSEMBAHAN
                        </h1>
                        <p className="mt-1 font-mono text-sm font-semibold text-muted-foreground">
                            Nomor: {donation.receipt_number}
                        </p>
                    </div>

                    {/* Receipt Details */}
                    <div className="my-6 space-y-4 text-sm">
                        <div className="grid grid-cols-3 gap-2 border-b border-border py-2">
                            <span className="text-muted-foreground">Telah Diterima Dari</span>
                            <span className="col-span-2 font-semibold text-foreground">
                                {member.name} ({member.member_number})
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-border py-2">
                            <span className="text-muted-foreground">Tanggal Transaksi</span>
                            <span className="col-span-2 text-foreground">{formatDate(donation.date)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-border py-2">
                            <span className="text-muted-foreground">Pos Persembahan</span>
                            <span className="col-span-2 font-medium text-foreground">
                                {donation.category_name ?? 'Umum'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-b border-border py-2">
                            <span className="text-muted-foreground">Metode Pembayaran</span>
                            <span className="col-span-2 capitalize text-foreground">
                                {donation.payment_method}
                            </span>
                        </div>

                        {donation.notes && (
                            <div className="grid grid-cols-3 gap-2 border-b border-border py-2">
                                <span className="text-muted-foreground">Keterangan</span>
                                <span className="col-span-2 text-foreground">
                                    {donation.notes}
                                </span>
                            </div>
                        )}

                        <div className="mt-6 rounded-xl bg-muted/60 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold uppercase text-muted-foreground">Jumlah Diterima:</span>
                                <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                                    {formatRupiah(donation.amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Verification & Signature Stamp */}
                    <div className="mt-8 border-t border-dashed border-border pt-6">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-income" />
                                <span>Tercatat Resmi dalam Buku Besar Gereja</span>
                            </div>
                            <span>Dokumen Sah Elektronik</span>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <div className="w-48 text-center text-xs">
                                <p className="text-muted-foreground">Bagian Keuangan / Bendahara</p>
                                <div className="my-6 text-income font-semibold">
                                    [ TERVERIFIKASI ]
                                </div>
                                <p className="font-semibold text-foreground">{churchName}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
