import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Printer } from 'lucide-react';

interface DonationDetail {
    id: number;
    receipt_number: string;
    donor_name: string | null;
    member?: {
        name: string;
        membership_number: string;
        phone: string | null;
    } | null;
    category: {
        name: string;
    };
    amount: number;
    payment_method: string;
    notes: string | null;
    created_at: string;
    count_sheet?: {
        id: number;
        date: string;
    } | null;
}

export default function DonationShow({ donation }: { donation: DonationDetail }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Persembahan Atas Nama', href: '/donations' },
        { title: donation.receipt_number, href: '#' },
    ];

    const donorDisplayName = donation.member ? donation.member.name : donation.donor_name ?? 'Anonim';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tanda Terima ${donation.receipt_number}`} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between no-print">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('donations.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Tanda Terima
                    </Button>
                </div>

                {/* Printable Receipt Card */}
                <Card className="border-2 shadow-sm p-6 space-y-6 print:border-none print:shadow-none">
                    <div className="border-b pb-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <CheckCircle2 className="h-5 w-5 text-income" />
                            <h2 className="text-xl font-bold tracking-tight">TANDA TERIMA PERSEMBAHAN</h2>
                        </div>
                        <p className="text-xs text-muted-foreground">Sistem Administrasi Kas & Keuangan Gereja</p>
                        <div className="mt-3 inline-block font-mono text-sm font-semibold bg-muted px-3 py-1 rounded">
                            {donation.receipt_number}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-xs uppercase text-muted-foreground font-semibold block">
                                Tanggal Penerimaan
                            </span>
                            <span className="font-medium">
                                {new Date(donation.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs uppercase text-muted-foreground font-semibold block">
                                Metode Pembayaran
                            </span>
                            <span className="font-medium capitalize">{donation.payment_method}</span>
                        </div>
                        <div>
                            <span className="text-xs uppercase text-muted-foreground font-semibold block">
                                Nama Jemaat / Donatur
                            </span>
                            <span className="font-bold text-base">{donorDisplayName}</span>
                            {donation.member && (
                                <span className="block text-xs text-muted-foreground font-mono">
                                    No. Anggota: {donation.member.membership_number}
                                </span>
                            )}
                        </div>
                        <div>
                            <span className="text-xs uppercase text-muted-foreground font-semibold block">
                                Pos Persembahan
                            </span>
                            <Badge variant="secondary" className="mt-1 font-semibold">
                                {donation.category.name}
                            </Badge>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/20 text-center">
                        <span className="text-xs uppercase text-muted-foreground font-semibold block">
                            Jumlah Persembahan
                        </span>
                        <div className="text-3xl font-extrabold text-primary my-1 tabular-nums">
                            {formatRupiah(donation.amount)}
                        </div>
                    </div>

                    {donation.notes && (
                        <div className="border-l-4 border-primary/50 pl-3 py-1 text-sm italic text-muted-foreground">
                            "{donation.notes}"
                        </div>
                    )}

                    <div className="pt-8 border-t flex justify-between text-xs text-muted-foreground">
                        <div>
                            Tercatat di sistem pada: {new Date(donation.created_at).toLocaleString('id-ID')}
                        </div>
                        <div className="text-right">
                            <p>Tanda tangan penerima,</p>
                            <div className="h-12"></div>
                            <p className="font-semibold text-foreground">Bendahara / Petugas Kolekte</p>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
