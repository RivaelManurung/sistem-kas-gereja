import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { RowActions } from '@/components/app/row-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Power } from 'lucide-react';
import { Search } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface UserSummary {
    id: number;
    name: string;
    email: string;
}

interface MemberRow {
    id: number;
    member_number: string | null;
    name: string;
    gender: 'L' | 'P' | null;
    birth_date: string | null;
    phone: string | null;
    email: string | null;
    user: UserSummary | null;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Jemaat', href: '/admin/members' }];

export default function MembersIndex({
    members,
    search: initialSearch,
}: {
    members: Paginated<MemberRow>;
    search: string;
}) {
    const [search, setSearch] = useState<string>(initialSearch || '');

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('admin.members.index'), { search }, { preserveState: true });
    };

    const [target, setTarget] = useState<MemberRow | null>(null);

    const confirmToggle = () => {
        if (!target) return;
        router.patch(route('admin.members.toggle', target.id), {}, { preserveScroll: true });
        setTarget(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Jemaat" />
            <div className="space-y-6 p-4 md:p-6">
                <PageHeader
                    title="Data Jemaat"
                    description="Kelola basis data jemaat gereja untuk pencatatan persembahan dan portal jemaat."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.members.create')}>Tambah Jemaat</Link>
                        </Button>
                    }
                />

                <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm">
                    <div className="relative w-full">
                        <Input
                            placeholder="Cari nama atau nomor jemaat..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pr-9"
                        />
                        <button
                            type="submit"
                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                            aria-label="Cari"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </div>
                    {search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                                setSearch('');
                                router.get(route('admin.members.index'));
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </form>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Jemaat</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>JK</TableHead>
                            <TableHead>Kontak</TableHead>
                            <TableHead>Akun Login</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.data.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-mono text-sm">
                                    {member.member_number ?? <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>
                                    {member.gender ? (
                                        <Badge variant="outline">{member.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <div>{member.phone ?? '-'}</div>
                                    <div className="text-xs text-muted-foreground">{member.email}</div>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {member.user ? (
                                        <Badge variant="secondary">{member.user.name}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">Belum ditautkan</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge active={member.is_active} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Ubah', icon: Pencil, href: route('admin.members.edit', member.id) },
                                            {
                                                label: member.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: Power,
                                                onSelect: () => setTarget(member),
                                                destructive: member.is_active,
                                                separated: true,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {members.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Tidak ada data jemaat yang cocok.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={members.links} />

                <ConfirmDialog
                    open={target !== null}
                    onOpenChange={(open) => !open && setTarget(null)}
                    title={target?.is_active ? 'Nonaktifkan data jemaat?' : 'Aktifkan data jemaat?'}
                    description={
                        target?.is_active
                            ? `${target?.name} tidak akan muncul lagi sebagai pilihan baru. Data lama tetap tersimpan dan bisa diaktifkan kembali.`
                            : `${target?.name} akan tersedia kembali sebagai pilihan.`
                    }
                    confirmLabel={target?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    destructive={target?.is_active}
                    onConfirm={confirmToggle}
                />
            </div>
        </AppLayout>
    );
}
