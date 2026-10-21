import { ConfirmDialog } from '@/components/app/confirm-dialog';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Check, Minus } from 'lucide-react';
import { useState } from 'react';
import { type RoleSummary } from './index';

interface Props {
    role: RoleSummary;
    groups: Array<{ group: string; permissions: Array<{ value: string; label: string; granted: boolean }> }>;
    users: Array<{ id: number; name: string; email: string; is_active: boolean }>;
    canEdit: boolean;
    canDelete: boolean;
}

export default function RoleShow({ role, groups, users, canEdit, canDelete }: Props) {
    const [confirming, setConfirming] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Peran & Hak Akses', href: '/admin/roles' },
        { title: role.label, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={role.label} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back="/admin/roles"
                    title={role.label}
                    description={role.description ?? (role.is_locked ? 'Memegang seluruh hak akses dan tidak bisa diubah.' : 'Belum ada deskripsi.')}
                    actions={
                        <>
                            {canEdit && (
                                <Button asChild>
                                    <Link href={route('admin.roles.edit', role.id)}>Ubah peran</Link>
                                </Button>
                            )}
                            <Button asChild variant="outline">
                                <Link href={route('admin.roles.create', { copy: role.id })}>Duplikat</Link>
                            </Button>
                            {canDelete && users.length === 0 && (
                                <Button variant="outline" className="text-destructive" onClick={() => setConfirming(true)}>
                                    Hapus
                                </Button>
                            )}
                        </>
                    }
                />

                <div className="grid items-start gap-6 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader className="flex-row items-start justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle>Hak akses</CardTitle>
                                <CardDescription>
                                    {role.permissions_count} izin aktif untuk peran ini{role.is_system ? ', peran bawaan sistem' : ''}.
                                </CardDescription>
                            </div>
                            {role.is_system && <Badge variant="outline">Bawaan</Badge>}
                        </CardHeader>
                        <CardContent className="divide-border divide-y p-0 md:p-0">
                            {groups.map((g) => (
                                <section key={g.group} className="grid gap-3 px-5 py-4 md:grid-cols-[200px_1fr] md:px-6">
                                    <h3 className="text-sm font-medium">{g.group}</h3>
                                    <ul className="space-y-2">
                                        {g.permissions.map((p) => (
                                            <li key={p.value} className={cn('flex items-center gap-2.5 text-sm', !p.granted && 'text-muted-foreground')}>
                                                {p.granted ? <Check className="text-income size-4 shrink-0" aria-label="Diizinkan" /> : <Minus className="size-4 shrink-0 opacity-50" aria-label="Tidak diizinkan" />}
                                                <span className={cn(!p.granted && 'line-through decoration-muted-foreground/40')}>{p.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="space-y-1">
                            <CardTitle>Pengguna dengan peran ini</CardTitle>
                            <CardDescription>{users.length} pengguna</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 md:p-0">
                            {users.length > 0 ? (
                                <ul className="divide-border divide-y">
                                    {users.map((u) => (
                                        <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3 md:px-6">
                                            <div className="min-w-0">
                                                <Link href={route('admin.users.edit', u.id)} className="truncate text-sm font-medium hover:underline">
                                                    {u.name}
                                                </Link>
                                                <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                                            </div>
                                            <StatusBadge active={u.is_active} />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground px-6 pb-6 text-sm">Belum ada pengguna yang memegang peran ini. Tetapkan peran dari halaman Pengguna.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title={`Hapus peran ${role.label}?`}
                description="Peran ini dihapus permanen dan tidak bisa dikembalikan. Riwayat perubahannya tetap tercatat di jejak aktivitas."
                confirmLabel="Hapus peran"
                destructive
                onConfirm={() => router.delete(route('admin.roles.destroy', role.id))}
            />
        </AppLayout>
    );
}
