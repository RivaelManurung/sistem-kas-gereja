import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, CircleAlert } from 'lucide-react';

export default function FlashMessage() {
    const { flash } = usePage<SharedData>().props;

    if (!flash?.success && !flash?.error) {
        return null;
    }

    const error = !flash.success;

    return (
        <div
            role={error ? 'alert' : 'status'}
            data-print="hide"
            className={
                error
                    ? 'border-expense/30 bg-expense/10 text-expense mx-4 mt-4 flex items-center gap-2 rounded-md border px-4 py-2 text-sm md:mx-6 lg:mx-8'
                    : 'border-income/30 bg-income/10 text-income mx-4 mt-4 flex items-center gap-2 rounded-md border px-4 py-2 text-sm md:mx-6 lg:mx-8'
            }
        >
            {error ? <CircleAlert className="size-4" /> : <CheckCircle2 className="size-4" />}
            {flash.success ?? flash.error}
        </div>
    );
}
