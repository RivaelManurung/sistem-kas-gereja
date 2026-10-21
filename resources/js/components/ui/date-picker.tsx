import { CalendarDays, X } from 'lucide-react';
import { format, isValid, parse } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const ISO = 'yyyy-MM-dd';

function toDate(value?: string | null) {
    if (!value) return undefined;
    const d = parse(value.slice(0, 10), ISO, new Date());
    return isValid(d) ? d : undefined;
}

interface DatePickerProps {
    /** Nilai dalam format `YYYY-MM-DD`, string kosong bila belum dipilih. */
    value?: string | null;
    onChange: (value: string) => void;
    id?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    /** Tampilkan tombol hapus saat ada nilai. */
    clearable?: boolean;
    min?: string;
    max?: string;
    className?: string;
}

export function DatePicker({ value, onChange, id, placeholder = 'Pilih tanggal', required, disabled, clearable, min, max, className }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const selected = toDate(value);
    const minDate = toDate(min);
    const maxDate = toDate(max);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className="relative">
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        aria-required={required}
                        className={cn(
                            'h-10 w-full justify-start gap-2 px-3 text-left font-normal',
                            !selected && 'text-muted-foreground',
                            clearable && selected && 'pr-9',
                            className,
                        )}
                    >
                        <CalendarDays className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{selected ? format(selected, 'd MMM yyyy', { locale: idLocale }) : placeholder}</span>
                    </Button>
                </PopoverTrigger>
                {clearable && selected && !disabled && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        aria-label="Hapus tanggal"
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-hidden"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>
            <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                    mode="single"
                    startMonth={minDate ?? new Date(2015, 0)}
                    endMonth={maxDate ?? new Date(new Date().getFullYear() + 5, 11)}
                    selected={selected}
                    defaultMonth={selected}
                    disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
                    onSelect={(d) => {
                        if (!d) return;
                        onChange(format(d, ISO));
                        setOpen(false);
                    }}
                    autoFocus
                />
                <div className="flex items-center justify-between border-t px-3 py-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-sm"
                        onClick={() => {
                            onChange(format(new Date(), ISO));
                            setOpen(false);
                        }}
                    >
                        Hari ini
                    </Button>
                    {clearable && selected && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-8 px-2 text-sm"
                            onClick={() => {
                                onChange('');
                                setOpen(false);
                            }}
                        >
                            Hapus
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
