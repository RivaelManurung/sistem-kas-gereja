import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    FileText,
    HeartHandshake,
    Printer,
    Receipt,
    UserCheck,
    Wallet,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Portal Jemaat',
        href: '/portal',
    },
];

interface MemberInfo {
    id: number;
    member_number: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}

interface DonationItem {
    id: number;
    receipt_number: string;
    amount: number;
    payment_method: string;
    created_at: string;
    notes?: string | null;
    category?: {
        id: number;
        name: string;
    } | null;
}

interface PaginatedDonations {
    data: DonationItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface CategoryTotal {
    category_name: string;
    amount: number;
}

interface PortalProps {
    isLinked: boolean;
    member: MemberInfo | null;
    donations?: PaginatedDonations | null;
    summary?: {
        thisYearTotal: number;
        allTimeTotal: number;
        count: number;
        byCategory: CategoryTotal[];
    } | null;
    availableYears?: number[];
    selectedYear?: number | null;
}

export default function MemberPortal({
    isLinked,
    member,
    donations,
    summary,
    availableYears = [],
    selectedYear = null,
}: PortalProps) {
    const handleYearChange = (year: string) => {
        if (year === 'all') {
            router.get('/portal');
        } else {
            router.get('/portal', { year });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portal Jemaat — Riwayat Persembahan Pribadi" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Portal Jemaat
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Riwayat persembahan atas nama pribadi dan bukti kontribusi tahunan.
                        </p>
                    </div>

                    {isLinked && (
                        <div className="flex items-center gap-2">
                            <Link href={`/portal/statement${selectedYear ? `?year=${selectedYear}` : ''}`}>
                                <Button size="sm" variant="outline" className="gap-1.5">
                                    <Printer className="size-4" />
                                    Cetak Bukti Tahunan
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {!isLinked ? (
                    /* Unlinked Member State */
                    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
                        <CardHeader className="text-center sm:text-left">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 sm:mx-0 dark:bg-amber-900/40 dark:text-amber-400">
                                <AlertCircle className="size-6" />
                            </div>
                            <CardTitle className="mt-3 text-lg font-semibold text-amber-900 dark:text-amber-200">
                                Akun Belum Terhubung dengan Data Anggota Jemaat
                            </CardTitle>
                            <CardDescription className="text-sm text-amber-800/80 dark:text-amber-300/80">
                                Akun login Anda saat ini belum dipautkan ke data induk anggota jemaat gereja. Untuk dapat melihat
                                catatan riwayat persembahan atas nama pribadi, silakan hubungi bagian administrasi atau sekretariat gereja untuk melakukan verifikasi data jemaat.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <>
                        {/* Member Identity Card */}
                        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3 sm:items-center">
                                    <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <UserCheck className="size-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                                {member?.name}
                                            </h2>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {member?.member_number}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            {member?.phone ? `${member.phone} · ` : ''}
                                            {member?.email || ''}
                                            {member?.address ? ` · ${member.address}` : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Year Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-neutral-500">Tahun:</span>
                                    <select
                                        className="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs text-neutral-900 shadow-xs focus:border-primary focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                        value={selectedYear ?? 'all'}
                                        onChange={(e) => handleYearChange(e.target.value)}
                                    >
                                        <option value="all">Semua Tahun</option>
                                        {availableYears.map((yr) => (
                                            <option key={yr} value={yr}>
                                                Tahun {yr}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stat Cards */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Persembahan Tahun Ini
                                    </CardTitle>
                                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                                        <HeartHandshake className="size-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
                                        {formatRupiah(summary?.thisYearTotal ?? 0)}
                                    </div>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        Total persembahan pribadi tercatat tahun berjalan
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Total Seluruh Waktu
                                    </CardTitle>
                                    <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                        <Wallet className="size-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(summary?.allTimeTotal ?? 0)}
                                    </div>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        Akumulasi dari {summary?.count ?? 0} kali persembahan
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Pernyataan Kontribusi
                                    </CardTitle>
                                    <div className="rounded-full bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
                                        <FileSpreadsheet className="size-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Link href={`/portal/statement${selectedYear ? `?year=${selectedYear}` : ''}`}>
                                        <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                                            <Printer className="size-3.5" />
                                            Cetak Laporan Tahunan
                                        </Button>
                                    </Link>
                                    <p className="mt-2 text-[11px] text-neutral-500">
                                        Format resmi untuk bukti perpajakan atau arsip keluarga
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Breakdown per Kategori */}
                        {summary?.byCategory && summary.byCategory.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Distribusi per Pos Persembahan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {summary.byCategory.map((cat) => (
                                            <div
                                                key={cat.category_name}
                                                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/60 p-2.5 text-xs dark:border-neutral-800 dark:bg-neutral-900/40"
                                            >
                                                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                                    {cat.category_name}
                                                </span>
                                                <span className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                                                    {formatRupiah(cat.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Donations List Table */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">
                                        Riwayat Persembahan Atas Nama Pribadi
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {donations?.total ?? 0} Transaksi
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Catatan resmi persembahan yang diverifikasi bendahara dan dicatat ke dalam buku besar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {donations && donations.data.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
                                                <tr>
                                                    <th className="py-2.5 pr-4 font-medium">Tanggal</th>
                                                    <th className="px-4 py-2.5 font-medium">No. Bukti</th>
                                                    <th className="px-4 py-2.5 font-medium">Kategori</th>
                                                    <th className="px-4 py-2.5 font-medium">Metode</th>
                                                    <th className="px-4 py-2.5 text-right font-medium">Nominal</th>
                                                    <th className="py-2.5 pl-4 text-right font-medium">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                {donations.data.map((don) => (
                                                    <tr key={don.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/50">
                                                        <td className="py-3 pr-4 font-medium text-neutral-900 dark:text-neutral-100">
                                                            {new Date(don.created_at).toLocaleDateString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                            {don.receipt_number}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className="text-[11px]">
                                                                {don.category?.name ?? 'Umum'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 capitalize text-neutral-600 dark:text-neutral-400">
                                                            {don.payment_method}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                                                            {formatRupiah(don.amount)}
                                                        </td>
                                                        <td className="py-3 pl-4 text-right">
                                                            <Link href={`/portal/receipt/${don.id}`}>
                                                                <Button size="sm" variant="ghost" className="h-7 text-xs">
                                                                    Kwitansi →
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-xs text-neutral-500">
                                        Belum ada catatan persembahan atas nama pribadi pada periode ini.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
