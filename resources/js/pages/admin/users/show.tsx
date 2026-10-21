import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { DefinitionList, DetailCard } from '@/components/app/detail';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Check, Minus } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
    id: number;
    created_at: string;
    sentence: string;
    event_label: string;
}

interface Props {
    user: { id: number; name: string; email: string; is_active: boolean; created_at: string | null; email_verified_at: string | null };
    member: { id: number; name: string; url: string | null } | null;
    roles: Array<{ id: number; label: string; url: string | null }>;
    groups: Array<{ group: string; permissions: Array<{ value: string; label: string; granted: boolean }> }>;
    permissionsCount: number;
    logs: LogEntry[];
    canToggle: boolean;
}

export default function UserShow({ user, member, roles, groups, permissionsCount, logs, canToggle }: Props) {
    const [confirming, setConfirming] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pengguna', href: '/admin/users' },
        { title: user.name, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={user.name} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title={user.name}
                    description={user.email}
                    actions={
                        <>
                            <Button asChild>
                                <Link href={route('admin.users.edit', user.id)}>Ubah</Link>
                            </Button>
                            {canToggle && (
                                <Button variant="outline" className={cn(user.is_active && 'text-destructive')} onClick={() => setConfirming(true)}>
                                    {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                </Button>
                            )}
                        </>
                    }
                />

                <div className="grid items-start gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <DetailCard title="Informasi akun">
                            <DefinitionList
                                items={[
                                    { label: 'Nama', value: user.name },
                                    { label: 'Email', value: user.email },
                                    { label: 'Status', value: <StatusBadge active={user.is_active} /> },
                                    { label: 'Dibuat', value: user.created_at ? formatDate(user.created_at) : null },
                                    { label: 'Email terverifikasi', value: user.email_verified_at ? formatDateTime(user.email_verified_at) : 'Belum diverifikasi' },
                                    {
                                        label: 'Data jemaat',
                                        value: member ? (
                                            member.url ? (
                                                <Link href={member.url} className="hover:underline">
                                                    {member.name}
                                                </Link>
                                            ) : (
                                                member.name
                                            )
                                        ) : (
                                            'Tidak terhubung'
                                        ),
                                    },
                                ]}
                            />
                        </DetailCard>

                        <DetailCard title="Hak akses efektif" description={`${permissionsCount} izin aktif dari gabungan peran pengguna ini.`} flush>
                            <div className="divide-border divide-y">
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
                            </div>
                        </DetailCard>
                    </div>

                    <div className="space-y-6">
                        <DetailCard title="Peran" description={`${roles.length} peran`}>
                            {roles.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {roles.map((r) =>
                                        r.url ? (
                                            <Link key={r.id} href={r.url}>
                                                <Badge variant="outline" className="hover:bg-muted">
                                                    {r.label}
                                                </Badge>
                                            </Link>
                                        ) : (
                                            <Badge key={r.id} variant="outline">
                                                {r.label}
                                            </Badge>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">Belum ada peran. Tetapkan lewat menu Ubah.</p>
                            )}
                        </DetailCard>

                        <DetailCard title="Aktivitas terbaru" description="15 catatan terakhir tentang akun ini." flush>
                            {logs.length > 0 ? (
                                <ul className="divide-border divide-y">
                                    {logs.map((l) => (
                                        <li key={l.id} className="px-5 py-3 md:px-6">
                                            <p className="text-sm">{l.sentence}</p>
                                            <p className="text-muted-foreground mt-0.5 text-xs">{formatDateTime(l.created_at)}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground px-6 pb-6 text-sm">Belum ada catatan aktivitas.</p>
                            )}
                        </DetailCard>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title={user.is_active ? `Nonaktifkan ${user.name}?` : `Aktifkan ${user.name}?`}
                description={user.is_active ? 'Pengguna ini tidak bisa masuk lagi sampai diaktifkan kembali. Data dan riwayat aktivitasnya tetap tersimpan.' : 'Pengguna ini bisa masuk kembali dengan peran yang dimilikinya.'}
                confirmLabel={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                destructive={user.is_active}
                onConfirm={() => router.patch(route('admin.users.toggle', user.id), {}, { preserveScroll: true, onFinish: () => setConfirming(false) })}
            />
        </AppLayout>
    );
}
