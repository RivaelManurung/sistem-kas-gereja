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
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Pengaturan akun</h1>
                <p className="text-sm text-muted-foreground">Kelola profil, tanda tangan, keamanan, dan tampilan akun Anda.</p>
            </header>

            <nav aria-label="Pengaturan akun" className="mt-6 flex gap-6 overflow-x-auto border-b">
                {tabs.map((tab) => {
                    const active = currentPath === tab.url;
                    return (
                        <Link
                            key={tab.url}
                            href={tab.url}
                            prefetch
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                '-mb-px shrink-0 border-b-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:text-foreground motion-reduce:transition-none',
                                active
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
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
