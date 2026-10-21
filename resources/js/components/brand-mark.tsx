import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Church } from 'lucide-react';

/** Logo gereja bila sudah diunggah di pengaturan, jika belum memakai ikon gereja. */
export function BrandMark({ className, iconClassName }: { className?: string; iconClassName?: string }) {
    const { brand } = usePage<SharedData>().props;

    if (brand.logo_url) {
        return <img src={brand.logo_url} alt="" className={cn('object-contain', className)} />;
    }

    return <Church className={cn(className, iconClassName)} aria-hidden="true" />;
}
