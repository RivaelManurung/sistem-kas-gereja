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
            return <Badge className={cn('bg-warning/10 text-warning border-warning/30', className)}>Menunggu</Badge>;
        case 'confirmed':
            return <Badge className={cn('bg-info/10 text-info border-info/30', className)}>Dikonfirmasi</Badge>;
        case 'verified':
            return <Badge className={cn('border-warning/30 bg-warning/10 text-warning', className)}>Terverifikasi</Badge>;
        case 'approved':
            return <Badge className={cn('border-info/30 bg-info/10 text-info', className)}>Disetujui</Badge>;
        case 'paid':
            return <Badge className={cn('border-income/30 bg-income/10 text-income', className)}>Dibayar</Badge>;
        case 'rejected':
            return <Badge variant="destructive" className={className}>Ditolak</Badge>;
        case 'locked':
            return <Badge className={cn('bg-muted text-white hover:bg-muted/60', className)}>Terkunci</Badge>;
        case 'closed':
            return <Badge variant="secondary" className={cn('text-muted-foreground', className)}>Ditutup</Badge>;
        case 'active':
            return <Badge className={cn('border-income/30 bg-income/10 text-income', className)}>Berjalan</Badge>;
        case 'planning':
            return <Badge variant="outline" className={className}>Perencanaan</Badge>;
        case 'completed':
            return <Badge className={cn('border-income/30 bg-income/10 text-income', className)}>Selesai</Badge>;
        default:
            return <Badge variant="outline" className={className}>{status}</Badge>;
    }
}

export default StatusBadge;
