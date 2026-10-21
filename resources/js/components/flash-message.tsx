import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

export default function FlashMessage() {
    const { flash } = usePage<SharedData>().props;

    if (!flash?.success) {
        return null;
    }

    return (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="size-4" />
            {flash.success}
        </div>
    );
}
