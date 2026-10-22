import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import InputError from '@/components/input-error';
import { BackIconButton } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatRupiah } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { type Account, type BreadcrumbItem, type EventFinancialSummary, type EventItem, type EventRole, type EventStatus, type Fund, type Member, type SharedData, type User } from '@/types';
import { type AttributeDefinition } from '@/types/attributes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { MaybeLinkRow } from '@/components/app/link-row';
import { ArrowDownLeft, ArrowUpRight, Calendar, DollarSign, Edit, Lock, PieChart, Plus, PlusCircle, Eye, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const statusLabels: Record<EventStatus, string> = {
    planning: 'Perencanaan',
    active: 'Berjalan',
    completed: 'Selesai',
    closed: 'Ditutup',
};

const statusVariants: Record<EventStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    planning: 'secondary',
    active: 'default',
    completed: 'outline',
    closed: 'outline',
};

const roleLabels: Record<EventRole, string> = {
    ketua: 'Ketua Panitia',
    sekretaris: 'Sekretaris',
    bendahara: 'Bendahara',
    anggota: 'Anggota',
};

interface EventExpenseEntry {
    id: number;
    entry_date: string;
    amount: number;
    description: string;
    account?: { id: number; name: string };
    category?: { id: number; name: string };
}

export default function EventShow({
    event,
    financialSummary,
    expenseEntries = [],
    accounts = [],
    targetFunds = [],
    users = [],
    members = [],
    attributeDefinitions = [],
    customAttributes = {},
}: {
    event: EventItem;
    financialSummary: EventFinancialSummary;
    expenseEntries?: EventExpenseEntry[];
    accounts?: Account[];
    targetFunds?: Fund[];
    users?: User[];
    members?: Member[];
    attributeDefinitions?: AttributeDefinition[];
    customAttributes?: Record<string, any>;
}) {
    const { auth } = usePage<SharedData>().props;
    const canMembers = (auth.permissions ?? []).includes('members.manage');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Acara & Kepanitiaan', href: '/events' },
        { title: event.name, href: '#' },
    ];

    const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

    // Form: Member
    const memberForm = useForm({
        user_id: '',
        member_id: '',
        role_in_event: 'anggota' as EventRole,
        notes: '',
    });

    // Form: Category
    const categoryForm = useForm({
        name: '',
        direction: 'in' as 'in' | 'out',
        allows_named: false,
        is_public: true,
    });

    // Form: Expense
    const expenseForm = useForm({
        entry_date: new Date().toISOString().split('T')[0],
        account_id: accounts[0]?.id ? String(accounts[0].id) : '',
        category_id: '',
        amount: '',
        description: '',
    });

    // Form: Close Event
    const closeForm = useForm({
        target_fund_id: targetFunds[0]?.id ? String(targetFunds[0].id) : '',
        notes: '',
    });

    const submitMember: FormEventHandler = (e) => {
        e.preventDefault();
        memberForm.post(route('events.members.store', event.id), {
            onSuccess: () => {
                setIsMemberDialogOpen(false);
                memberForm.reset();
            },
        });
    };

    const submitCategory: FormEventHandler = (e) => {
        e.preventDefault();
        categoryForm.post(route('events.categories.store', event.id), {
            onSuccess: () => {
                setIsCategoryDialogOpen(false);
                categoryForm.reset();
            },
        });
    };

    const submitExpense: FormEventHandler = (e) => {
        e.preventDefault();
        expenseForm.post(route('events.expenses.store', event.id), {
            onSuccess: () => {
                setIsExpenseDialogOpen(false);
                expenseForm.reset();
            },
        });
    };

    const submitClose: FormEventHandler = (e) => {
        e.preventDefault();
        closeForm.post(route('events.close', event.id), {
            onSuccess: () => {
                setIsCloseDialogOpen(false);
            },
        });
    };

    const expenseCategories = (event.categories || []).filter((c) => c.direction === 'out');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.name} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <BackIconButton href={route('events.index')} />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{event.name}</h1>
                            <Badge variant={statusVariants[event.status]}>
                                {statusLabels[event.status]}
                            </Badge>
                        </div>
                        {event.theme && (
                            <p className="text-muted-foreground italic mt-1 text-sm">
                                "{event.theme}"
                            </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(event.start_date)} {event.end_date && `s/d ${formatDate(event.end_date)}`}
                            </span>
                            {event.fund && (
                                <span className="flex items-center gap-1">
                                    <PieChart className="h-3.5 w-3.5 text-primary" />
                                    Pos Dana: <strong className="text-foreground">{event.fund.name} ({event.fund.code})</strong>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {event.status !== 'closed' && (
                            <>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={route('events.edit', event.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>

                                <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Lock className="mr-2 h-4 w-4" />
                                            Tutup Acara
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Penutupan Acara & Pemindahan Sisa Dana</DialogTitle>
                                            <DialogDescription>
                                                Setelah acara ditutup, status akan berubah menjadi ditutup dan tidak dapat menerima transaksi baru.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form onSubmit={submitClose} className="space-y-4 py-2">
                                            <div className="rounded-lg border p-3 bg-muted/40 space-y-1">
                                                <div className="text-xs text-muted-foreground">Sisa Saldo Kas Acara Saat Ini:</div>
                                                <div className="text-lg font-bold text-foreground tabular-nums">
                                                    {formatRupiah(financialSummary.remaining_balance)}
                                                </div>
                                            </div>

                                            {financialSummary.remaining_balance > 0 ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor="target_fund_id">
                                                        Pindahkan Sisa Saldo ke Pos Dana: <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select
                                                        value={closeForm.data.target_fund_id}
                                                        onValueChange={(val) => closeForm.setData('target_fund_id', val)}
                                                    >
                                                        <SelectTrigger id="target_fund_id">
                                                            <SelectValue placeholder="Pilih Pos Dana Tujuan (mis. Kas Umum)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {targetFunds.map((f) => (
                                                                <SelectItem key={f.id} value={String(f.id)}>
                                                                    {f.name} ({f.code})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError message={closeForm.errors.target_fund_id} />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Saldo kas acara bernilai nol. Tidak ada pemindahan dana yang perlu dicatat di buku besar.
                                                </p>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="close_notes">Catatan Penutupan</Label>
                                                <Textarea
                                                    id="close_notes"
                                                    rows={3}
                                                    placeholder="Keterangan berita acara penutupan kepanitiaan..."
                                                    value={closeForm.data.notes}
                                                    onChange={(e) => closeForm.setData('notes', e.target.value)}
                                                />
                                            </div>

                                            <DialogFooter className="pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsCloseDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    variant="destructive"
                                                    disabled={closeForm.processing}
                                                >
                                                    {closeForm.processing ? 'Memproses...' : 'Konfirmasi Tutup Acara'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Target Anggaran</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold ">{formatRupiah(financialSummary.target_budget)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Realisasi pengeluaran: {financialSummary.budget_realization_pct}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pemasukan</CardTitle>
                            <ArrowDownLeft className="h-4 w-4 text-income" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-income tabular-nums">
                                {formatRupiah(financialSummary.total_income)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Dari berita acara hitung acara
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-expense" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-expense tabular-nums">
                                {formatRupiah(financialSummary.total_expenses)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Beban pengeluaran terlaksana
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/40 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-foreground">Sisa Saldo Kas</CardTitle>
                            <PieChart className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground tabular-nums">
                                {formatRupiah(financialSummary.remaining_balance)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Saldo aktif di buku besar
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="members" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
                        <TabsTrigger value="members" className="py-2">Panitia ({event.members?.length ?? 0})</TabsTrigger>
                        <TabsTrigger value="income" className="py-2">Pemasukan ({event.count_sheets?.length ?? 0})</TabsTrigger>
                        <TabsTrigger value="expenses" className="py-2">Pengeluaran ({expenseEntries.length})</TabsTrigger>
                        <TabsTrigger value="categories" className="py-2">Kategori ({event.categories?.length ?? 0})</TabsTrigger>
                        <TabsTrigger value="details" className="py-2">Rincian & EAV</TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Panitia */}
                    <TabsContent value="members" className="space-y-4 pt-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Susunan Kepanitiaan</h3>
                                <p className="text-xs text-muted-foreground">Daftar petugas dan penanggung jawab kegiatan.</p>
                            </div>

                            {event.status !== 'closed' && (
                                <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah Panitia
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Tambah Anggota Panitia</DialogTitle>
                                            <DialogDescription>
                                                Pilih akun pengguna terdaftar atau anggota jemaat gereja untuk ditugaskan.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form onSubmit={submitMember} className="space-y-4 py-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="user_id">Akun Pengguna Sistem (Opsional)</Label>
                                                <Select
                                                    value={memberForm.data.user_id}
                                                    onValueChange={(val) => memberForm.setData('user_id', val)}
                                                >
                                                    <SelectTrigger id="user_id">
                                                        <SelectValue placeholder="Pilih akun pengguna (bila ada)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-- Tanpa Akun Pengguna --</SelectItem>
                                                        {users.map((u) => (
                                                            <SelectItem key={u.id} value={String(u.id)}>
                                                                {u.name} ({u.email})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="member_id">Anggota Jemaat (Opsional)</Label>
                                                <Select
                                                    value={memberForm.data.member_id}
                                                    onValueChange={(val) => memberForm.setData('member_id', val)}
                                                >
                                                    <SelectTrigger id="member_id">
                                                        <SelectValue placeholder="Pilih dari buku jemaat" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-- Bukan Jemaat Terdaftar --</SelectItem>
                                                        {members.map((m) => (
                                                            <SelectItem key={m.id} value={String(m.id)}>
                                                                {m.name} ({m.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="role_in_event">
                                                    Peran dalam Acara <span className="text-destructive">*</span>
                                                </Label>
                                                <Select
                                                    value={memberForm.data.role_in_event}
                                                    onValueChange={(val) => memberForm.setData('role_in_event', val as EventRole)}
                                                >
                                                    <SelectTrigger id="role_in_event">
                                                        <SelectValue placeholder="Pilih peran" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ketua">Ketua Panitia</SelectItem>
                                                        <SelectItem value="sekretaris">Sekretaris</SelectItem>
                                                        <SelectItem value="bendahara">Bendahara Panitia</SelectItem>
                                                        <SelectItem value="anggota">Anggota</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={memberForm.errors.role_in_event} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="member_notes">Catatan / Seksi</Label>
                                                <Input
                                                    id="member_notes"
                                                    placeholder="Contoh: Koordinator Konsumsi, Perlengkapan"
                                                    value={memberForm.data.notes}
                                                    onChange={(e) => memberForm.setData('notes', e.target.value)}
                                                />
                                            </div>

                                            <DialogFooter className="pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsMemberDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button type="submit" disabled={memberForm.processing}>
                                                    {memberForm.processing ? 'Menyimpan...' : 'Tambahkan'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Petugas</TableHead>
                                        <TableHead>Peran</TableHead>
                                        <TableHead>Keterangan / Seksi</TableHead>
                                        <TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!event.members || event.members.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                                                Belum ada susunan panitia yang ditambahkan.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        event.members.map((m) => (
                                            <MaybeLinkRow key={m.id} href={canMembers && m.member ? route('admin.members.show', m.member.id) : null}>
                                                <TableCell className="font-medium">
                                                    {m.user?.name || m.member?.name || 'Panitia Non-Akun'}
                                                    {m.user && (
                                                        <span className="ml-2 text-xs text-muted-foreground">({m.user.email})</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {roleLabels[m.role_in_event] ?? m.role_in_event}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {m.notes || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <RowActions
                                                        actions={[
                                                            {
                                                                label: 'Hapus dari panitia',
                                                                icon: Trash2,
                                                                onSelect: () => setMemberToRemove(m.id),
                                                                destructive: true,
                                                                hidden: event.status === 'closed',
                                                            },
                                                        ]}
                                                    />
                                                </TableCell>
                                            </MaybeLinkRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Pemasukan (Count Sheets) */}
                    <TabsContent value="income" className="space-y-4 pt-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Berita Acara Hitung Acara</h3>
                                <p className="text-xs text-muted-foreground">Pemasukan persembahan atau penjualan tiket/bazaar kegiatan.</p>
                            </div>

                            {event.status !== 'closed' && (
                                <Button size="sm" asChild>
                                    <Link href={`/counting/create?type=event&event_id=${event.id}`}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Input Berita Acara Hitung
                                    </Link>
                                </Button>
                            )}
                        </div>

                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Rekening Kas</TableHead>
                                        <TableHead>Pencatat</TableHead>
                                        <TableHead className="text-right">Total Nominal</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!event.count_sheets || event.count_sheets.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-sm">
                                                Belum ada berita acara penghitungan untuk acara ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        event.count_sheets.map((cs) => (
                                            <LinkRow key={cs.id} href={route('counting.show', cs.id)}>
                                                <TableCell className="font-mono text-xs">#{cs.id}</TableCell>
                                                <TableCell className="text-sm font-medium">{formatDate(cs.date)}</TableCell>
                                                <TableCell className="text-sm">{cs.account?.name ?? '-'}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{cs.creator?.name ?? '-'}</TableCell>
                                                <TableCell className="text-right font-semibold tabular-nums text-income">
                                                    +{formatRupiah(cs.total_amount)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">{cs.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <RowActions actions={[{ label: 'Lihat detail', icon: Eye, href: route('counting.show', cs.id) }]} />
                                                </TableCell>
                                            </LinkRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Tab 3: Pengeluaran */}
                    <TabsContent value="expenses" className="space-y-4 pt-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Pengeluaran Kas Acara</h3>
                                <p className="text-xs text-muted-foreground">Pencatatan realisasi belanja dari pos dana acara.</p>
                            </div>

                            {event.status !== 'closed' && (
                                <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Catat Pengeluaran
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Catat Pengeluaran Acara</DialogTitle>
                                            <DialogDescription>
                                                Pengeluaran akan langsung mendebit pos dana acara ini di buku besar.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form onSubmit={submitExpense} className="space-y-4 py-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="entry_date">Tanggal Pengeluaran <span className="text-destructive">*</span></Label>
                                                <DatePicker
                                                    id="entry_date"
                                                    value={expenseForm.data.entry_date}
                                                    onChange={(v) => expenseForm.setData('entry_date', v)}
                                                />
                                                <InputError message={formatDate(expenseForm.errors.entry_date)} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="account_id">Rekening Sumber Kas <span className="text-destructive">*</span></Label>
                                                <Select
                                                    value={expenseForm.data.account_id}
                                                    onValueChange={(val) => expenseForm.setData('account_id', val)}
                                                >
                                                    <SelectTrigger id="account_id">
                                                        <SelectValue placeholder="Pilih rekening kas" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {accounts.map((acc) => (
                                                            <SelectItem key={acc.id} value={String(acc.id)}>
                                                                {acc.name} ({acc.type})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={expenseForm.errors.account_id} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="category_id">Kategori Pengeluaran <span className="text-destructive">*</span></Label>
                                                <Select
                                                    value={expenseForm.data.category_id}
                                                    onValueChange={(val) => expenseForm.setData('category_id', val)}
                                                >
                                                    <SelectTrigger id="category_id">
                                                        <SelectValue placeholder="Pilih kategori pengeluaran" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {expenseCategories.length === 0 ? (
                                                            <SelectItem value="none" disabled>
                                                                Belum ada kategori pengeluaran acara (buat di tab Kategori)
                                                            </SelectItem>
                                                        ) : (
                                                            expenseCategories.map((cat) => (
                                                                <SelectItem key={cat.id} value={String(cat.id)}>
                                                                    {cat.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={expenseForm.errors.category_id} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="amount">Nominal Pengeluaran (Rupiah) <span className="text-destructive">*</span></Label>
                                                <MoneyInput id="amount" value={expenseForm.data.amount} onChange={(v) => expenseForm.setData('amount', String(v))} />
                                                <InputError message={expenseForm.errors.amount} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description">Keterangan Belanja</Label>
                                                <Input
                                                    id="description"
                                                    placeholder="Contoh: Pembelian konsumsi rapat, sewa sound system"
                                                    value={expenseForm.data.description}
                                                    onChange={(e) => expenseForm.setData('description', e.target.value)}
                                                />
                                            </div>

                                            <DialogFooter className="pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsExpenseDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button type="submit" disabled={expenseForm.processing}>
                                                    {expenseForm.processing ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Rekening Sumber</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead className="text-right">Nominal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenseEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                                                Belum ada transaksi pengeluaran yang dicatat.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenseEntries.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell className="text-sm">{formatDate(e.entry_date)}</TableCell>
                                                <TableCell className="text-sm">{e.account?.name ?? '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{e.category?.name ?? 'Pengeluaran'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{e.description}</TableCell>
                                                <TableCell className="text-right font-semibold tabular-nums text-expense">
                                                    -{formatRupiah(e.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Tab 4: Kategori Acara */}
                    <TabsContent value="categories" className="space-y-4 pt-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Kategori Khusus Acara</h3>
                                <p className="text-xs text-muted-foreground">Kategori ini hanya muncul saat transaksi acara bersangkutan.</p>
                            </div>

                            {event.status !== 'closed' && (
                                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah Kategori
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Tambah Kategori Khusus Acara</DialogTitle>
                                            <DialogDescription>
                                                Kategori akan di-scope ke acara ini dan pos dana tujuannya otomatis mengarah ke dana acara.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form onSubmit={submitCategory} className="space-y-4 py-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="cat_name">Nama Kategori <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="cat_name"
                                                    placeholder="Contoh: Tiket Masuk, Konsumsi Panitia, Perlengkapan"
                                                    value={categoryForm.data.name}
                                                    onChange={(e) => categoryForm.setData('name', e.target.value)}
                                                />
                                                <InputError message={categoryForm.errors.name} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="cat_dir">Arah Aliran Dana <span className="text-destructive">*</span></Label>
                                                <Select
                                                    value={categoryForm.data.direction}
                                                    onValueChange={(val) => categoryForm.setData('direction', val as 'in' | 'out')}
                                                >
                                                    <SelectTrigger id="cat_dir">
                                                        <SelectValue placeholder="Pilih arah" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="in">Pemasukan (In)</SelectItem>
                                                        <SelectItem value="out">Pengeluaran (Out)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={categoryForm.errors.direction} />
                                            </div>

                                            <DialogFooter className="pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsCategoryDialogOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button type="submit" disabled={categoryForm.processing}>
                                                    {categoryForm.processing ? 'Menyimpan...' : 'Tambahkan'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Kategori</TableHead>
                                        <TableHead>Arah Dana</TableHead>
                                        <TableHead>Pos Dana Tujuan</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!event.categories || event.categories.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                                                Belum ada kategori khusus yang dibuat untuk acara ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        event.categories.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={c.direction === 'in' ? 'default' : 'secondary'}>
                                                        {c.direction === 'in' ? 'Pemasukan' : 'Pengeluaran'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-mono">{event.fund?.code}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">Aktif</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Tab 5: Rincian & EAV */}
                    <TabsContent value="details" className="space-y-4 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Rincian Acara & Master Pos Dana</CardTitle>
                                <CardDescription>Informasi umum dan pos dana buku besar yang dialokasikan.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <span className="font-semibold text-muted-foreground">Deskripsi:</span>
                                    <p className="mt-1 text-foreground whitespace-pre-wrap">{event.description || 'Tidak ada deskripsi.'}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                                    <div>
                                        <span className="font-semibold text-muted-foreground">Pos Dana Terkait:</span>
                                        <p className="mt-1 text-foreground">{event.fund?.name} ({event.fund?.code})</p>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-muted-foreground">Status Pos Dana:</span>
                                        <p className="mt-1">
                                            <Badge variant={event.fund?.is_active ? 'default' : 'secondary'}>
                                                {event.fund?.is_active ? 'Aktif' : 'Nonaktif / Ditutup'}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>

                                {attributeDefinitions.length > 0 && (
                                    <div className="border-t pt-4 space-y-3">
                                        <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">
                                            Data Kustom (EAV)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {attributeDefinitions.map((def) => (
                                                <div key={def.id}>
                                                    <span className="text-xs text-muted-foreground">{def.label}:</span>
                                                    <p className="font-medium text-foreground">
                                                        {customAttributes[def.key] !== undefined && customAttributes[def.key] !== null
                                                            ? String(customAttributes[def.key])
                                                            : '-'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <ConfirmDialog
                open={memberToRemove !== null}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                title="Hapus anggota panitia?"
                description="Anggota ini dikeluarkan dari susunan panitia acara dan tidak lagi dapat mengakses acara ini sebagai panitia."
                confirmLabel="Hapus"
                destructive
                onConfirm={() => {
                    if (memberToRemove !== null) memberForm.delete(route('events.members.destroy', [event.id, memberToRemove]));
                    setMemberToRemove(null);
                }}
            />
        </AppLayout>
    );
}
