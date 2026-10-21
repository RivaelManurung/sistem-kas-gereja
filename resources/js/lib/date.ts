import { format, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

type DateInput = string | null | undefined;

/** "2026-10-21" -> "21 Okt 2026". Tanggal tanpa jam tidak digeser zona waktu. */
export function formatDate(value: DateInput): string {
    if (!value) return '-';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date(value);
    return isValid(date) ? format(date, 'd MMM yyyy', { locale: id }) : value;
}

/** "2026-10-21T09:30:00Z" -> "21 Okt 2026, 16.30" (zona waktu peramban). */
export function formatDateTime(value: DateInput): string {
    if (!value) return '-';
    const date = new Date(value);
    return isValid(date) ? format(date, 'd MMM yyyy, HH.mm', { locale: id }) : value;
}

export function formatDateRange(start: DateInput, end?: DateInput): string {
    return end && end !== start ? `${formatDate(start)} - ${formatDate(end)}` : formatDate(start);
}
