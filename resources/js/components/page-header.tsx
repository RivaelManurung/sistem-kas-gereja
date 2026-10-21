import { type ReactNode } from 'react';

export default function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
    return (
        <div className="flex flex-col gap-4 pb-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="min-w-0 space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
