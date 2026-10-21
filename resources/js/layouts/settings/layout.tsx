import PageHeader from '@/components/page-header';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

const tabs = [
    { title: 'Profil', url: '/settings/profile' },
    { title: 'Tanda tangan', url: '/settings/signature' },
    { title: 'Kata sandi', url: '/settings/password' },
    { title: 'Tampilan', url: '/settings/appearance' },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="w-full p-4 md:p-6 lg:p-8">
            <PageHeader title="Pengaturan akun" description="Kelola profil, tanda tangan, keamanan, dan tampilan akun Anda." />

            {/* Link tabs styled like components/ui/tabs.tsx so every tab bar matches. */}
            <nav aria-label="Pengaturan akun" className="bg-muted text-muted-foreground mt-6 inline-flex h-9 max-w-full items-center gap-1 overflow-x-auto rounded-lg p-1">
                {tabs.map((tab) => {
                    const active = currentPath === tab.url;
                    return (
                        <Link
                            key={tab.url}
                            href={tab.url}
                            prefetch
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'ring-offset-background focus-visible:ring-ring inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                active ? 'bg-primary text-primary-foreground shadow' : 'hover:text-foreground',
                            )}
                        >
                            {tab.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="divide-y">{children}</div>
        </div>
    );
}

/** Satu bagian pengaturan: judul + keterangan di kiri, isi (biasanya Card) di kanan pada lg+. */
export function SettingsSection({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('grid gap-4 py-8 first:pt-8 last:pb-0 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10', className)}>
            <div className="space-y-1">
                <h2 className="font-medium">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="min-w-0">{children}</div>
        </section>
    );
}
