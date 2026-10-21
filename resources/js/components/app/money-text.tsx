import { formatRupiah } from '@/lib/money';
import { cn } from '@/lib/utils';

interface MoneyTextProps {
    amount: number;
    className?: string;
    showSign?: boolean;
    colored?: boolean;
}

export function MoneyText({ amount, className, showSign = false, colored = false }: MoneyTextProps) {
    const isNegative = amount < 0;
    const isPositive = amount > 0;

    let formatted = formatRupiah(amount);
    if (showSign && isPositive) {
        formatted = `+${formatted}`;
    }

    const colorClass = colored
        ? isNegative
            ? 'text-expense'
            : isPositive
              ? 'text-income'
              : 'text-muted-foreground'
        : '';

    return (
        <span className={cn('tabular-nums font-mono font-medium', colorClass, className)}>
            {formatted}
        </span>
    );
}

export default MoneyText;
