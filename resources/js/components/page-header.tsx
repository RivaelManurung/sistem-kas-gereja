import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';

export function BackButton({ href }: { href: string }) {
    return (
        <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2.5 h-8 px-2.5 print:hidden" asChild>
            <Link href={href}>
                <ArrowLeft className="h-4 w-4" />
                Kembali
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
    /** Detail pages pass their list URL to get a uniform back button. */
    back?: string;
}) {
    return (
        <div className="space-y-3 pb-2">
            {back && <BackButton href={back} />}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                <div className="min-w-0 space-y-1.5">
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    {description && <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}
