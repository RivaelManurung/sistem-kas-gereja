import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Pencil, Power } from 'lucide-react';
import { useState } from 'react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pengguna', href: '/admin/users' }];

export default function UsersIndex({ users }: { users: Paginated<UserRow> }) {
    const { auth } = usePage<SharedData>().props;
    const [target, setTarget] = useState<UserRow | null>(null);

    const toggle = () => {
        if (!target) return;
        router.patch(route('admin.users.toggle', target.id), {}, { preserveScroll: true, onFinish: () => setTarget(null) });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengguna" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Pengguna"
                    description="Akun dibuat oleh admin. Pengguna nonaktif tidak bisa masuk."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.users.create')}>Tambah pengguna</Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Peran</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.data.map((user) => (
                            <LinkRow key={user.id} href={route('admin.users.show', user.id)}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles.length > 0 ? (
                                            user.roles.map((role) => (
                                                <Badge key={role} variant="outline">
                                                    {role}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Belum ada peran</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge active={user.is_active} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('admin.users.show', user.id) },
                                            { label: 'Ubah', icon: Pencil, href: route('admin.users.edit', user.id) },
                                            {
                                                label: user.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: Power,
                                                onSelect: () => setTarget(user),
                                                destructive: user.is_active,
                                                separated: true,
                                                hidden: user.id === auth.user.id,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
                        ))}
                        {users.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                                    Belum ada pengguna.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={users.links} />
            </div>

            <ConfirmDialog
                open={target !== null}
                onOpenChange={(open) => !open && setTarget(null)}
                title={target?.is_active ? `Nonaktifkan ${target?.name}?` : `Aktifkan ${target?.name}?`}
                description={
                    target?.is_active
                        ? 'Pengguna ini tidak bisa masuk lagi sampai diaktifkan kembali. Data dan riwayat aktivitasnya tetap tersimpan.'
                        : 'Pengguna ini bisa masuk kembali dengan peran yang dimilikinya.'
                }
                confirmLabel={target?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                destructive={target?.is_active}
                onConfirm={toggle}
            />
        </AppLayout>
    );
}
