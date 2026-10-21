import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { LinkRow } from '@/components/app/link-row';
import { RowActions } from '@/components/app/row-actions';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Copy, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface RoleSummary {
    id: number;
    name: string;
    label: string;
    description: string | null;
    is_system: boolean;
    is_locked: boolean;
    users_count: number;
    permissions_count: number;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Peran & Hak Akses', href: '/admin/roles' }];

export default function RolesIndex({ roles, totalPermissions }: { roles: RoleSummary[]; totalPermissions: number }) {
    const [target, setTarget] = useState<RoleSummary | null>(null);

    const remove = () => {
        if (!target) return;
        router.delete(route('admin.roles.destroy', target.id), { preserveScroll: true, onFinish: () => setTarget(null) });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Peran & Hak Akses" />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title="Peran & Hak Akses"
                    description="Tentukan siapa boleh melakukan apa. Pengguna mendapat hak akses dari peran, bukan diberikan satu per satu."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.roles.create')}>Buat peran</Link>
                        </Button>
                    }
                />

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Peran</TableHead>
                            <TableHead className="w-32 text-right">Pengguna</TableHead>
                            <TableHead className="w-64">Hak akses</TableHead>
                            <TableHead className="w-12">
                                <span className="sr-only">Aksi</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <LinkRow key={role.id} href={route('admin.roles.show', role.id)}>
                                <TableCell>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">{role.label}</span>
                                        {role.is_system && <Badge variant="outline">Bawaan</Badge>}
                                    </div>
                                    {role.description && <p className="text-muted-foreground mt-0.5 text-sm">{role.description}</p>}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{role.users_count}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full" aria-hidden="true">
                                            <div className="bg-primary/70 h-full rounded-full" style={{ width: `${(role.permissions_count / Math.max(totalPermissions, 1)) * 100}%` }} />
                                        </div>
                                        <span className="text-muted-foreground text-sm whitespace-nowrap tabular-nums">
                                            {role.permissions_count} dari {totalPermissions}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RowActions
                                        actions={[
                                            { label: 'Lihat detail', icon: Eye, href: route('admin.roles.show', role.id) },
                                            { label: 'Ubah', icon: Pencil, href: route('admin.roles.edit', role.id), hidden: role.is_locked },
                                            { label: 'Duplikat', icon: Copy, href: route('admin.roles.create', { copy: role.id }) },
                                            {
                                                label: 'Hapus',
                                                icon: Trash2,
                                                onSelect: () => setTarget(role),
                                                destructive: true,
                                                separated: true,
                                                hidden: role.is_system || role.users_count > 0,
                                            },
                                        ]}
                                    />
                                </TableCell>
                            </LinkRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={target !== null}
                onOpenChange={(open) => !open && setTarget(null)}
                title={`Hapus peran ${target?.label}?`}
                description="Peran ini dihapus permanen dan tidak bisa dikembalikan. Riwayat perubahannya tetap tercatat di jejak aktivitas."
                confirmLabel="Hapus peran"
                destructive
                onConfirm={remove}
            />
        </AppLayout>
    );
}
