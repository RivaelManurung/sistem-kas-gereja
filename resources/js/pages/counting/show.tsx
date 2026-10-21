import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, Edit, Lock, Trash2, Users } from 'lucide-react';

interface ConfirmationUser {
    id: number;
    name: string;
}

interface ConfirmationItem {
    id: number;
    user_id: number;
    confirmed_at: string;
    user: ConfirmationUser;
}

interface DonationItem {
    id: number;
    donor_name: string | null;
    member?: {
        id: number;
        name: string;
    } | null;
    category?: {
        name: string;
    };
    amount: number;
    receipt_number: string;
}

interface SheetDetail {
    id: number;
    type: 'service' | 'general' | 'event';
    date: string;
    status: 'draft' | 'confirmed' | 'verified' | 'locked';
    total_amount: number;
    notes: string | null;
    service_session: {
        id: number;
        name: string;
        date: string;
    } | null;
    account: {
        id: number;
        name: string;
    };
    creator: {
        id: number;
        name: string;
    };
    lines: Array<{
        id: number;
        is_cash: boolean;
        amount: number;
        denomination_counts: Record<string, number> | null;
        reference_number: string | null;
        category: {
            id: number;
            name: string;
            allows_named: boolean;
        };
    }>;
    confirmations?: ConfirmationItem[];
    donations?: DonationItem[];
}

export default function CountingShow({
    sheet,
    setting,
}: {
    sheet: SheetDetail;
    setting: {
        min_confirmations_service: number;
        min_confirmations_general: number;
    };
}) {
    const page = usePage();
    const currentUser = (page.props as any).auth?.user;
    const userRole = currentUser?.role;

    const { delete: destroy, processing: deleting } = useForm();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Berita Acara Hitung', href: '/counting' },
        { title: `BA-${String(sheet.id).padStart(5, '0')}`, href: '#' },
    ];

    const requiredConfirmations =
        sheet.type === 'service' ? setting.min_confirmations_service : setting.min_confirmations_general;
    const confirmationsCount = sheet.confirmations?.length ?? 0;
    const hasCurrentUserConfirmed = sheet.confirmations?.some((c) => c.user_id === currentUser?.id) ?? false;

    const isLocked = sheet.status === 'locked';
    const isVerified = sheet.status === 'verified';
    const isConfirmed = sheet.status === 'confirmed';
    const isDraft = sheet.status === 'draft';

    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDelete = () => {
        destroy(route('counting.destroy', sheet.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Berita Acara BA-${String(sheet.id).padStart(5, '0')}`} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back="/counting"
                    title={`Berita Acara Penghitungan #BA-${String(sheet.id).padStart(5, '0')}`}
                    description={
                        sheet.service_session
                            ? `Sesi: ${sheet.service_session.name} (${formatDate(sheet.service_session.date)})`
                            : `Penerimaan Kas - Tanggal ${formatDate(sheet.date)}`
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            {!isLocked && (
                                <Button variant="outline" asChild>
                                    <Link href={route('counting.edit', sheet.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            )}

                            {isDraft && (
                                <Button
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => setConfirmDelete(true)}
                                    disabled={deleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                </Button>
                            )}
                        </div>
                    }
                />

                {/* Status and Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold">
                                Status Dokumen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sheet.status === 'draft' && <Badge variant="outline">Draf Penghitungan</Badge>}
                            {sheet.status === 'confirmed' && (
                                <Badge variant="secondary" className="bg-info/10 text-info border-info/30">
                                    Terkonfirmasi Saksi ({confirmationsCount}/{requiredConfirmations})
                                </Badge>
                            )}
                            {sheet.status === 'verified' && (
                                <Badge className="border-warning/30 bg-warning/10 text-warning">Terverifikasi Bendahara</Badge>
                            )}
                            {sheet.status === 'locked' && (
                                <Badge className="border-income/30 bg-income/10 text-income flex items-center gap-1 w-fit">
                                    <Lock className="h-3 w-3" /> Terkunci di Buku Besar
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold">
                                Total Kas Dihitung
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary tabular-nums">
                                {formatRupiah(sheet.total_amount)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold">
                                Rekening Penampung
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-semibold">{sheet.account.name}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase text-muted-foreground font-semibold">
                                Petugas Pembuat
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-medium text-sm">{sheet.creator.name}</div>
                            <div className="text-muted-foreground text-xs">{formatDate(sheet.date)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Workflow Actions Section */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Alur Pengesahan Berita Acara
                        </CardTitle>
                        <CardDescription>
                            Sesuai tata kelola, berita acara memerlukan konfirmasi saksi penghitung, verifikasi bendahara, dan pembukuan ke buku besar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Task 5 & Task 6 action buttons placeholder and hook */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Konfirmasi Saksi */}
                            {!isLocked && (
                                <Button
                                    variant={hasCurrentUserConfirmed ? 'secondary' : 'default'}
                                    disabled={hasCurrentUserConfirmed}
                                    asChild={!hasCurrentUserConfirmed}
                                >
                                    {hasCurrentUserConfirmed ? (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-income" />
                                            Anda Sudah Mengonfirmasi
                                        </>
                                    ) : (
                                        <Link
                                            href={`/counting/${sheet.id}/confirm`}
                                            method="post"
                                            as="button"
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Konfirmasi Sebagai Saksi ({confirmationsCount}/{requiredConfirmations})
                                        </Link>
                                    )}
                                </Button>
                            )}

                            {/* Verifikasi Bendahara */}
                            {isConfirmed && ['bendahara', 'admin'].includes(userRole) && (
                                <Button variant="outline" className="border-warning/30 text-warning" asChild>
                                    <Link href={`/counting/${sheet.id}/verify`} method="post" as="button">
                                        Verifikasi Sebagai Bendahara
                                    </Link>
                                </Button>
                            )}

                            {/* Kunci ke Buku Besar */}
                            {isVerified && ['bendahara', 'admin'].includes(userRole) && (
                                <Button className="border-income/30 bg-income/10 text-income" asChild>
                                    <Link href={`/counting/${sheet.id}/lock`} method="post" as="button">
                                        <Lock className="mr-2 h-4 w-4" />
                                        Kunci & Bukukan ke Buku Besar
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* List of confirmations */}
                        {sheet.confirmations && sheet.confirmations.length > 0 && (
                            <div className="pt-2 border-t text-sm">
                                <span className="font-semibold text-xs uppercase text-muted-foreground">
                                    Dikonfirmasi oleh:
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {sheet.confirmations.map((conf) => (
                                        <Badge key={conf.id} variant="outline" className="bg-background">
                                            {conf.user.name} ({new Date(conf.confirmed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Per Category Lines Breakdown */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold tracking-tight">Rincian Fisik Persembahan</h3>
                    {sheet.lines.map((line, idx) => {
                        const counts = line.denomination_counts ?? {};
                        const hasCounts = Object.keys(counts).length > 0;

                        return (
                            <Card key={line.id ?? idx}>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">{line.category.name}</CardTitle>
                                        <CardDescription>
                                            {line.is_cash ? 'Persembahan Tunai' : `Non-Tunai (Ref: ${line.reference_number || '-'})`}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground uppercase">Subtotal</div>
                                        <div className="text-lg font-bold text-primary tabular-nums">
                                            {formatRupiah(line.amount)}
                                        </div>
                                    </div>
                                </CardHeader>
                                {line.is_cash && hasCounts && (
                                    <CardContent>
                                        <div className="border rounded-md overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/50">
                                                        <TableHead>Pecahan</TableHead>
                                                        <TableHead className="text-center">Jumlah Lembar/Keping</TableHead>
                                                        <TableHead className="text-right">Subtotal Rupiah</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Object.entries(counts)
                                                        .sort(([a], [b]) => Number(b) - Number(a))
                                                        .map(([denom, count]) => {
                                                            const d = Number(denom);
                                                            const c = Number(count);
                                                            if (c <= 0) return null;
                                                            return (
                                                                <TableRow key={denom}>
                                                                    <TableCell className="font-medium">
                                                                        {formatRupiah(d)}
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-mono">
                                                                        {c.toLocaleString('id-ID')}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-semibold tabular-nums">
                                                                        {formatRupiah(d * c)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Persembahan Atas Nama (Donations) Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base">Persembahan Atas Nama (Amplop Pribadi)</CardTitle>
                            <CardDescription>
                                Rekap persembahan perpuluhan, syukur, atau pembangunan beridentitas jemaat dalam berita acara ini.
                            </CardDescription>
                        </div>
                        {!isLocked && (
                            <Button size="sm" variant="outline" asChild>
                                <Link href={`/donations/create?count_sheet_id=${sheet.id}`}>
                                    + Catat Atas Nama
                                </Link>
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {sheet.donations && sheet.donations.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Tanda Terima</TableHead>
                                        <TableHead>Nama Jemaat / Donatur</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-right">Nominal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sheet.donations.map((don) => (
                                        <LinkRow key={don.id} href={route('donations.show', don.id)}>
                                            <TableCell className="font-mono text-xs">{don.receipt_number}</TableCell>
                                            <TableCell className="font-medium">
                                                {don.member ? don.member.name : don.donor_name}
                                            </TableCell>
                                            <TableCell>{don.category?.name ?? '-'}</TableCell>
                                            <TableCell className="text-right font-semibold tabular-nums">
                                                {formatRupiah(don.amount)}
                                            </TableCell>
                                        </LinkRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                                Tidak ada persembahan atas nama yang tercatat pada berita acara ini.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Hapus draf berita acara?"
                description="Draf berita acara ini beserta rincian hitungnya akan dihapus permanen dan tidak dapat dikembalikan."
                confirmLabel="Hapus"
                destructive
                onConfirm={handleDelete}
            />
        </AppLayout>
    );
}
