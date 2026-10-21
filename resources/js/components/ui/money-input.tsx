import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as React from 'react';

const MAX_RUPIAH = 999_999_999_999;
const format = (n: number) => (n > 0 ? new Intl.NumberFormat('id-ID').format(n) : '');

interface MoneyInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'min' | 'max'> {
    value: number | string | null | undefined;
    /** Selalu menerima bilangan bulat rupiah (tanpa titik pemisah). */
    onChange: (value: number) => void;
    max?: number;
}

/** Kolom nominal rupiah: pemisah ribuan otomatis, hanya angka, kursor tetap di tempatnya saat mengetik. */
export function MoneyInput({ value, onChange, max = MAX_RUPIAH, className, ...props }: MoneyInputProps) {
    const ref = React.useRef<HTMLInputElement>(null);
    const caret = React.useRef<number | null>(null);
    const amount = Number(value) || 0;
    const display = format(amount);

    React.useLayoutEffect(() => {
        if (caret.current !== null && ref.current) {
            ref.current.setSelectionRange(caret.current, caret.current);
            caret.current = null;
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const pos = e.target.selectionStart ?? raw.length;
        const digitsBeforeCaret = raw.slice(0, pos).replace(/\D/g, '').length;
        const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
        const next = Math.min(Number(digits || 0), max);
        const formatted = format(next);

        let seen = 0;
        let newPos = formatted.length;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) seen++;
            if (seen === digitsBeforeCaret) {
                newPos = i + 1;
                break;
            }
        }
        caret.current = digitsBeforeCaret === 0 ? 0 : newPos;
        onChange(next);
    };

    return (
        <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm" aria-hidden="true">
                Rp
            </span>
            <Input
                ref={ref}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={display}
                onChange={handleChange}
                className={cn('pl-10 tabular-nums', className)}
                {...props}
            />
        </div>
    );
}
