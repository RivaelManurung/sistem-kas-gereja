import PageHeader from '@/components/page-header';
import Pagination from '@/components/pagination';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Option, type Paginated, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pengguna', href: '/admin/users' }];

export default function UsersIndex({ users, roleOptions }: { users: Paginated<UserRow>; roleOptions: Option[] }) {
    const { auth } = usePage<SharedData>().props;
    const roleLabel = (value: string) => roleOptions.find((option) => option.value === value)?.label ?? value;

    const toggle = (user: UserRow) => {
        const verb = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Yakin ingin ${verb} ${user.name}?`)) {
            router.patch(route('admin.users.toggle', user.id), {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengguna" />
            <div className="space-y-6 p-4">
                <PageHeader
                    title="Pengguna"
                    description="Akun dibuat oleh admin. Pengguna nonaktif tidak bisa masuk."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.users.create')}>Tambah Pengguna</Link>
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
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.data.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles.map((role) => (
                                            <Badge key={role} variant="outline">
                                                {roleLabel(role)}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge active={user.is_active} />
                                </TableCell>
                                <TableCell className="space-x-2 text-right">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={route('admin.users.edit', user.id)}>Ubah</Link>
                                    </Button>
                                    {user.id !== auth.user.id && (
                                        <Button variant="ghost" size="sm" onClick={() => toggle(user)}>
                                            {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground text-center">
                                    Belum ada pengguna.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Pagination links={users.links} />
            </div>
        </AppLayout>
    );
}
