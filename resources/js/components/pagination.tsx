import { cn } from '@/lib/utils';
import { type PaginationLink } from '@/types';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center gap-1" aria-label="Navigasi halaman">
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.url ?? '#'}
                    preserveScroll
                    preserveState
                    className={cn(
                        'rounded-md border px-3 py-1 text-sm',
                        link.active && 'bg-primary text-primary-foreground',
                        !link.url && 'pointer-events-none opacity-50',
                    )}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </nav>
    );
}
