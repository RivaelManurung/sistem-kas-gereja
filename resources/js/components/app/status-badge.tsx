import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SystemStatus =
    | 'draft'
    | 'pending'
    | 'confirmed'
    | 'verified'
    | 'approved'
    | 'paid'
    | 'rejected'
    | 'locked'
    | 'closed'
    | 'active'
    | 'completed'
    | 'planning';

interface StatusBadgeProps {
    status?: SystemStatus | string;
    active?: boolean;
    className?: string;
}

export function StatusBadge({ status, active, className }: StatusBadgeProps) {
    if (active !== undefined) {
        return (
            <Badge variant={active ? 'default' : 'secondary'} className={className}>
                {active ? 'Aktif' : 'Nonaktif'}
            </Badge>
        );
    }

    switch (status) {
        case 'draft':
            return <Badge variant="outline" className={cn('text-muted-foreground border-muted-foreground/30', className)}>Draf</Badge>;
        case 'pending':
            return <Badge className={cn('bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20', className)}>Menunggu</Badge>;
        case 'confirmed':
            return <Badge className={cn('bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20', className)}>Dikonfirmasi</Badge>;
        case 'verified':
            return <Badge className={cn('bg-amber-600 text-white hover:bg-amber-700', className)}>Terverifikasi</Badge>;
        case 'approved':
            return <Badge className={cn('bg-blue-600 text-white hover:bg-blue-700', className)}>Disetujui</Badge>;
        case 'paid':
            return <Badge className={cn('bg-emerald-600 text-white hover:bg-emerald-700', className)}>Dibayar</Badge>;
        case 'rejected':
            return <Badge variant="destructive" className={className}>Ditolak</Badge>;
        case 'locked':
            return <Badge className={cn('bg-slate-700 text-white dark:bg-slate-600 hover:bg-slate-800', className)}>Terkunci</Badge>;
        case 'closed':
            return <Badge variant="secondary" className={cn('text-muted-foreground', className)}>Ditutup</Badge>;
        case 'active':
            return <Badge className={cn('bg-emerald-600 text-white hover:bg-emerald-700', className)}>Berjalan</Badge>;
        case 'planning':
            return <Badge variant="outline" className={className}>Perencanaan</Badge>;
        case 'completed':
            return <Badge className={cn('bg-emerald-600 text-white hover:bg-emerald-700', className)}>Selesai</Badge>;
        default:
            return <Badge variant="outline" className={className}>{status}</Badge>;
    }
}

export default StatusBadge;
