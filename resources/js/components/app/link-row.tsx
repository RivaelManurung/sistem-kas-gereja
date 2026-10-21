import { TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import * as React from 'react';

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="menuitem"], [role="checkbox"], [data-no-row-click]';

/**
 * Baris tabel yang membuka halaman detail saat diklik (bukan modal).
 * Klik pada tombol, tautan, atau menu aksi di dalam baris tidak ikut memicu navigasi.
 */
export function LinkRow({ href, className, children, ...props }: { href: string } & Omit<React.ComponentProps<typeof TableRow>, 'onClick'>) {
    const go = () => router.visit(href);

    return (
        <TableRow
            tabIndex={0}
            onClick={(e) => {
                if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
                go();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target === e.currentTarget) go();
            }}
            className={cn('focus-visible:bg-muted/60 cursor-pointer focus-visible:outline-hidden', className)}
            {...props}
        >
            {children}
        </TableRow>
    );
}
