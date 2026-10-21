export function formatRupiah(value: number | bigint | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return 'Rp 0';
    }

    const num = typeof value === 'string' ? Number(value) : Number(value);
    if (isNaN(num)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

export function parseRupiah(formatted: string): number {
    const cleaned = formatted.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
}
