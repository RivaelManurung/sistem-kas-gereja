import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';

/** Standalone back link for pages with a custom header. Kept slim so it does not push the title down. */
export function BackButton({ href }: { href: string }) {
    return (
        <Button variant="ghost" size="sm" className="text-muted-foreground -mb-3 -ml-2.5 h-7 px-2.5 print:hidden" asChild>
            <Link href={href}>
                <ArrowLeft className="h-4 w-4" />
                Kembali
            </Link>
        </Button>
    );
}

/** Icon-only back arrow for custom headers that already have their own title row. */
export function BackIconButton({ href }: { href: string }) {
    return (
        <Button variant="ghost" size="icon" className="text-muted-foreground -ml-2 size-9 shrink-0 print:hidden" asChild>
            <Link href={href} aria-label="Kembali" title="Kembali">
                <ArrowLeft className="size-5" />
            </Link>
        </Button>
    );
}

export default function PageHeader({
    title,
    description,
    actions,
    back,
}: {
    title: string;
    description?: string;
    actions?: ReactNode;
    /** Detail and form pages pass their parent list URL; the back arrow sits on the title row to save vertical space. */
    back?: string;
}) {
    return (
        <div className="flex flex-col gap-4 pb-1 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="flex min-w-0 items-start gap-2">
                {back && (
                    <Button variant="ghost" size="icon" className="text-muted-foreground -ml-2 size-9 shrink-0 print:hidden" asChild>
                        <Link href={back} aria-label="Kembali" title="Kembali">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                )}
                <div className="min-w-0 space-y-1.5">
                    <h1 className="text-2xl leading-9 font-semibold tracking-tight">{title}</h1>
                    {description && <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>}
                </div>
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
