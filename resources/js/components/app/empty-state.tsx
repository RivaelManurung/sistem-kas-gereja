import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    children?: ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, children, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed bg-muted/20', className)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icon className="h-6 w-6 text-muted-foreground opacity-60" />
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
            {action && (
                <div className="mt-4">
                    {action.href ? (
                        <Button asChild size="sm">
                            <Link href={action.href}>{action.label}</Link>
                        </Button>
                    ) : (
                        <Button size="sm" onClick={action.onClick}>
                            {action.label}
                        </Button>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}

export default EmptyState;
