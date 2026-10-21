import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

/** Kartu bagian pada halaman detail: judul, keterangan singkat, aksi di kanan, lalu isi. */
export function DetailCard({
    title,
    description,
    actions,
    children,
    flush,
    className,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    /** Isi tanpa padding, untuk tabel atau daftar yang melebar penuh. */
    flush?: boolean;
    className?: string;
}) {
    return (
        <Card className={className}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                    <CardTitle>{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </CardHeader>
            <CardContent className={cn(flush && 'p-0 md:p-0')}>{children}</CardContent>
        </Card>
    );
}

/** Pasangan label dan nilai untuk data satu record. Nilai kosong tampil sebagai "-". */
export function DefinitionList({ items, columns = 2, className }: { items: Array<{ label: string; value: ReactNode; hidden?: boolean }>; columns?: 1 | 2 | 3; className?: string }) {
    const cols = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' }[columns];

    return (
        <dl className={cn('grid gap-x-8 gap-y-5', cols, className)}>
            {items
                .filter((item) => !item.hidden)
                .map((item) => (
                    <div key={item.label} className="min-w-0">
                        <dt className="text-muted-foreground text-sm">{item.label}</dt>
                        <dd className="mt-1 text-sm font-medium break-words">{item.value === null || item.value === undefined || item.value === '' ? '-' : item.value}</dd>
                    </div>
                ))}
        </dl>
    );
}

/** Deretan angka ringkas di bagian atas halaman detail. */
export function StatTiles({ items }: { items: Array<{ label: string; value: ReactNode; tone?: 'income' | 'expense' | 'warning'; hint?: string }> }) {
    return (
        <Card>
            <div className="divide-border flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
                {items.map((item) => (
                    <div key={item.label} className="flex-1 p-5 md:p-6">
                        <p className="text-muted-foreground text-sm">{item.label}</p>
                        <p className={cn('mt-1.5 text-2xl font-semibold tracking-tight tabular-nums', item.tone === 'income' && 'text-income', item.tone === 'expense' && 'text-expense', item.tone === 'warning' && 'text-warning')}>{item.value}</p>
                        {item.hint && <p className="text-muted-foreground mt-1 text-xs">{item.hint}</p>}
                    </div>
                ))}
            </div>
        </Card>
    );
}
