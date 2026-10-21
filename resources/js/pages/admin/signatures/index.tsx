import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Eye, FileSignature, Image as ImageIcon, Pencil, PlusCircle, Power, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SignatoryRow {
    id: number;
    title: string;
    position: string;
    role?: string | null;
    user_id?: number | null;
    order: number;
    is_active: boolean;
    user?: { id: number; name: string; email: string } | null;
}

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface RoleOption {
    value: string;
    label: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengaturan', href: '/admin/settings' },
    { title: 'Susunan Penanda Tangan & Stempel', href: '/admin/signatures' },
];

export default function SignaturesIndex({
    signatories,
    users,
    roles,
    stamp_url,
}: {
    signatories: SignatoryRow[];
    users: UserOption[];
    roles: RoleOption[];
    stamp_url?: string | null;
}) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SignatoryRow | null>(null);
    const [editingSignatory, setEditingSignatory] = useState<SignatoryRow | null>(null);

    const [formTitle, setFormTitle] = useState('Dibuat oleh');
    const [formPosition, setFormPosition] = useState('Bendahara Jemaat');
    const [formRole, setFormRole] = useState('bendahara');
    const [formUserId, setFormUserId] = useState<string>('none');
    const [formOrder, setFormOrder] = useState<number>(signatories.length + 1);

    const [stampFile, setStampFile] = useState<File | null>(null);
    const [isUploadingStamp, setIsUploadingStamp] = useState(false);

    const openCreate = () => {
        setEditingSignatory(null);
        setFormTitle('Dibuat oleh');
        setFormPosition('');
        setFormRole('bendahara');
        setFormUserId('none');
        setFormOrder(signatories.length + 1);
        setCreateDialogOpen(true);
    };

    useEffect(() => {
        const id = Number(new URLSearchParams(window.location.search).get('edit'));
        const target = id ? signatories.find((s) => s.id === id) : null;
        if (target) {
            openEdit(target);
            window.history.replaceState(null, '', window.location.pathname);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openEdit = (sig: SignatoryRow) => {
        setEditingSignatory(sig);
        setFormTitle(sig.title);
        setFormPosition(sig.position);
        setFormRole(sig.role || 'none');
        setFormUserId(sig.user_id ? String(sig.user_id) : 'none');
        setFormOrder(sig.order);
        setCreateDialogOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            title: formTitle,
            position: formPosition,
            role: formRole === 'none' ? null : formRole,
            user_id: formUserId === 'none' ? null : Number(formUserId),
            order: formOrder,
            is_active: editingSignatory ? editingSignatory.is_active : true,
        };

        if (editingSignatory) {
            router.put(route('admin.signatures.update', editingSignatory.id), payload, {
                onSuccess: () => setCreateDialogOpen(false),
            });
        } else {
            router.post(route('admin.signatures.store'), payload, {
                onSuccess: () => setCreateDialogOpen(false),
            });
        }
    };

    const handleToggle = (sig: SignatoryRow) => {
        router.patch(route('admin.signatures.toggle', sig.id));
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('admin.signatures.destroy', deleteTarget.id));
        setDeleteTarget(null);
    };

    const handleUploadStamp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!stampFile) return;

        setIsUploadingStamp(true);
        const data = new FormData();
        data.append('stamp', stampFile);
        data.append('_method', 'PUT');

        router.post(route('admin.settings.update'), data, {
            onFinish: () => {
                setIsUploadingStamp(false);
                setStampFile(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Susunan Penanda Tangan & Stempel Gereja" />

            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Susunan Penanda Tangan & Stempel"
                    description="Atur urutan penanda tangan laporan keuangan resmi (Bendahara, Pemeriksa, Majelis) dan unggah stempel gereja."
                    actions={
                        <Button onClick={openCreate}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Penanda Tangan
                        </Button>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stamp Upload & Preview Card */}
                    <Card className="bg-card shadow-sm md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center">
                                <ImageIcon className="mr-2 h-5 w-5 text-info" />
                                Stempel Resmi Gereja
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Stempel format PNG transparan (disimpan privat, otomatis dibubuhkan saat laporan dibekukan).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center p-4 rounded-lg border border-dashed border-border bg-muted/60">
                                {stamp_url ? (
                                    <img src={stamp_url} alt="Stempel Gereja" className="max-h-32 object-contain" />
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground text-xs">
                                        Belum ada stempel gereja diunggah.
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleUploadStamp} className="space-y-3">
                                <div>
                                    <Label htmlFor="stamp_input" className="text-xs">Pilih Berkas Stempel (PNG)</Label>
                                    <Input
                                        id="stamp_input"
                                        type="file"
                                        accept="image/png"
                                        onChange={(e) => setStampFile(e.target.files?.[0] || null)}
                                        className="text-xs"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!stampFile || isUploadingStamp}
                                    className="w-full"
                                >
                                    <Upload className="mr-2 h-3.5 w-3.5" />
                                    {isUploadingStamp ? 'Mengunggah...' : 'Unggah Stempel'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Signatories Table Card */}
                    <Card className="bg-card shadow-sm md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center">
                                <FileSignature className="mr-2 h-5 w-5 text-info" />
                                Urutan Penanda Tangan Laporan Keuangan
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Setiap pejabat yang ditentukan di sini wajib menandatangani laporan secara mandiri dari akunnya masing-masing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">Urutan</TableHead>
                                            <TableHead>Jabatan / Judul</TableHead>
                                            <TableHead>Peran / Akun</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-12">
                                                <span className="sr-only">Aksi</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {signatories.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                                                    Belum ada susunan penanda tangan. Klik &ldquo;Tambah Penanda Tangan&rdquo; untuk membuat.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            signatories.map((sig) => (
                                                <LinkRow key={sig.id} href={route('admin.signatures.show', sig.id)}>
                                                    <TableCell className="font-bold text-center">{sig.order}</TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold text-sm">{sig.position}</div>
                                                        <div className="text-xs text-muted-foreground">{sig.title}</div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {sig.user ? (
                                                            <div>
                                                                <span className="font-medium">{sig.user.name}</span>
                                                                <span className="block text-muted-foreground">{sig.user.email}</span>
                                                            </div>
                                                        ) : sig.role ? (
                                                            <Badge variant="secondary">Role: {sig.role}</Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">Semua Pejabat</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge active={sig.is_active} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <RowActions
                                                            actions={[
                                                                { label: 'Lihat detail', icon: Eye, href: route('admin.signatures.show', sig.id) },
                                                                { label: 'Ubah', icon: Pencil, onSelect: () => openEdit(sig) },
                                                                {
                                                                    label: sig.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                                    icon: Power,
                                                                    onSelect: () => handleToggle(sig),
                                                                },
                                                                {
                                                                    label: 'Hapus',
                                                                    icon: Trash2,
                                                                    onSelect: () => setDeleteTarget(sig),
                                                                    destructive: true,
                                                                    separated: true,
                                                                },
                                                            ]}
                                                        />
                                                    </TableCell>
                                                </LinkRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Dialog Form Create / Edit */}
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogContent>
                        <form onSubmit={handleSave}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingSignatory ? 'Ubah Penanda Tangan' : 'Tambah Penanda Tangan'}
                                </DialogTitle>
                                <DialogDescription>
                                    Tentukan jabatan, judul pengesahan, urutan posisi, dan akun/peran yang berhak menandatangani.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Judul Pengesahan</Label>
                                        <Input
                                            id="title"
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder="mis. Dibuat oleh, Disetujui oleh"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="order">Urutan (1, 2, 3..)</Label>
                                        <Input
                                            id="order"
                                            type="number"
                                            min="1"
                                            value={formOrder}
                                            onChange={(e) => setFormOrder(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position">Jabatan Resmi</Label>
                                    <Input
                                        id="position"
                                        value={formPosition}
                                        onChange={(e) => setFormPosition(e.target.value)}
                                        placeholder="mis. Bendahara Jemaat, Ketua Majelis, Pendeta"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Berdasarkan Peran Akun (Role)</Label>
                                    <Select value={formRole} onValueChange={setFormRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Peran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Tanpa Peran Spesifik --</SelectItem>
                                            {roles.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Atau Tentukan Pengguna Khusus (Opsional)</Label>
                                    <Select value={formUserId} onValueChange={setFormUserId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Pengguna Tertentu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Pengguna Bebas Sesuai Peran --</SelectItem>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name} ({u.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit">
                                    {editingSignatory ? 'Simpan Perubahan' : 'Tambahkan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    title="Hapus penanda tangan?"
                    description={`Susunan "${deleteTarget?.position}" dihapus dari daftar penanda tangan laporan keuangan dan tidak bisa dikembalikan.`}
                    confirmLabel="Hapus"
                    destructive
                    onConfirm={confirmDelete}
                />
            </div>
        </AppLayout>
    );
}
