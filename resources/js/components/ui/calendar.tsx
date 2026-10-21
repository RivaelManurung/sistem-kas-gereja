import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker, getDefaultClassNames, useDayPicker, type MonthCaptionProps } from 'react-day-picker';
import { id as idLocale } from 'react-day-picker/locale';
import { format } from 'date-fns';
import { id as dfLocale } from 'date-fns/locale';

import { buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';


/** Judul kalender: pilih bulan dan tahun lewat Select shadcn, tanpa dropdown bawaan browser. */
function MonthYearCaption({ calendarMonth, startMonth, endMonth }: MonthCaptionProps & { startMonth?: Date; endMonth?: Date }) {
    const { goToMonth } = useDayPicker();
    const current = calendarMonth.date;
    const first = (startMonth ?? new Date(current.getFullYear() - 100, 0)).getFullYear();
    const last = (endMonth ?? new Date(current.getFullYear() + 10, 11)).getFullYear();
    const years = Array.from({ length: last - first + 1 }, (_, i) => last - i);

    return (
        <div className="flex h-8 items-center justify-center gap-1.5 px-9">
            <Select value={String(current.getMonth())} onValueChange={(m) => goToMonth(new Date(current.getFullYear(), Number(m), 1))}>
                <SelectTrigger aria-label="Bulan" className="h-8 w-auto gap-1.5 border-0 bg-transparent px-2 text-sm font-semibold shadow-none hover:bg-accent">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                    {Array.from({ length: 12 }, (_, m) => (
                        <SelectItem key={m} value={String(m)}>
                            {format(new Date(2000, m, 1), 'LLLL', { locale: dfLocale })}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={String(current.getFullYear())} onValueChange={(y) => goToMonth(new Date(Number(y), current.getMonth(), 1))}>
                <SelectTrigger aria-label="Tahun" className="h-8 w-auto gap-1.5 border-0 bg-transparent px-2 text-sm font-semibold tabular-nums shadow-none hover:bg-accent">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                    {years.map((y) => (
                        <SelectItem key={y} value={String(y)} className="tabular-nums">
                            {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
    const defaults = getDefaultClassNames();

    return (
        <DayPicker
            locale={idLocale}
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                root: cn('w-fit', defaults.root),
                months: 'relative flex flex-col gap-4 sm:flex-row',
                month: 'flex w-full flex-col gap-3',
                nav: 'absolute inset-x-0 top-0 flex w-full items-center justify-between',
                button_previous: cn(buttonVariants({ variant: 'ghost' }), 'size-8 p-0 text-muted-foreground hover:text-foreground'),
                button_next: cn(buttonVariants({ variant: 'ghost' }), 'size-8 p-0 text-muted-foreground hover:text-foreground'),
                month_caption: '',
                caption_label: 'text-sm font-semibold',
                dropdowns: 'flex h-8 items-center justify-center gap-1.5 text-sm font-medium',
                dropdown_root: 'relative rounded-md border border-input has-focus:ring-2 has-focus:ring-ring',
                dropdown: 'absolute inset-0 cursor-pointer opacity-0',
                months_dropdown: '',
                years_dropdown: '',
                table: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'text-muted-foreground w-9 flex-1 text-center text-xs font-medium',
                week: 'mt-1 flex w-full',
                day: 'group/day relative size-9 flex-1 p-0 text-center text-sm',
                day_button: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'size-9 w-full rounded-md p-0 font-normal tabular-nums aria-selected:opacity-100',
                    'group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:text-primary-foreground group-data-[selected=true]/day:hover:bg-primary',
                ),
                selected: '',
                today: 'font-semibold [&>button]:ring-1 [&>button]:ring-primary/40',
                outside: 'text-muted-foreground/50',
                disabled: 'text-muted-foreground opacity-40',
                hidden: 'invisible',
                range_start: 'rounded-l-md bg-accent',
                range_end: 'rounded-r-md bg-accent',
                range_middle: 'bg-accent',
                ...classNames,
            }}
            components={{
                MonthCaption: (captionProps) => <MonthYearCaption {...captionProps} startMonth={props.startMonth} endMonth={props.endMonth} />,
                Chevron: ({ orientation, className: c }) =>
                    orientation === 'left' ? <ChevronLeft className={cn('size-4', c)} /> : <ChevronRight className={cn('size-4', c)} />,
            }}
            {...props}
        />
    );
}

export { Calendar };
