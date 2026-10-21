import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';

export interface RowAction {
    label: string;
    icon?: LucideIcon;
    /** Pindah halaman. Pakai `onSelect` untuk aksi lain (kirim form, buka dialog konfirmasi). */
    href?: string;
    onSelect?: () => void;
    destructive?: boolean;
    /** Sembunyikan aksi yang tidak boleh dilakukan pengguna ini. */
    hidden?: boolean;
    /** Beri garis pemisah sebelum aksi ini. */
    separated?: boolean;
}

/** Menu titik tiga di kolom terakhir tabel. Klik di sini tidak ikut membuka halaman detail baris. */
export function RowActions({ actions, label = 'Aksi' }: { actions: RowAction[]; label?: string }) {
    const visible = actions.filter((a) => !a.hidden);
    if (visible.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label={label} onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44" onClick={(e) => e.stopPropagation()}>
                {visible.map((a, i) => {
                    const Icon = a.icon;
                    const content = (
                        <>
                            {Icon && <Icon className="size-4" aria-hidden="true" />}
                            {a.label}
                        </>
                    );
                    return (
                        <div key={a.label}>
                            {a.separated && i > 0 && <DropdownMenuSeparator />}
                            {a.href ? (
                                <DropdownMenuItem asChild className={cn(a.destructive && 'text-destructive focus:text-destructive')}>
                                    <Link href={a.href}>{content}</Link>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onSelect={a.onSelect} className={cn(a.destructive && 'text-destructive focus:text-destructive')}>
                                    {content}
                                </DropdownMenuItem>
                            )}
                        </div>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
