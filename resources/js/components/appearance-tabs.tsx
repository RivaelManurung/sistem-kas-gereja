import { Card, CardContent } from '@/components/ui/card';
import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type Palette = { bg: string; side: string; bar: string; card: string; line: string };

const light: Palette = { bg: '#f6f7f9', side: '#ffffff', bar: '#e4e7ec', card: '#ffffff', line: '#d0d5dd' };
const dark: Palette = { bg: '#14161a', side: '#1c1f24', bar: '#2c3037', card: '#1c1f24', line: '#3a3f47' };

function Mini({ p }: { p: Palette }) {
    return (
        <div className="flex h-full w-full" style={{ backgroundColor: p.bg }}>
            <div className="w-1/4 space-y-1.5 p-2" style={{ backgroundColor: p.side }}>
                <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: p.line }} />
                <div className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: p.bar }} />
                <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: p.bar }} />
            </div>
            <div className="flex-1 space-y-1.5 p-2">
                <div className="h-1.5 w-1/3 rounded-full" style={{ backgroundColor: p.line }} />
                <div className="rounded-sm p-1.5" style={{ backgroundColor: p.card, border: `1px solid ${p.bar}` }}>
                    <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: p.bar }} />
                    <div className="mt-1 h-1.5 w-2/3 rounded-full" style={{ backgroundColor: p.bar }} />
                </div>
            </div>
        </div>
    );
}

function Preview({ value }: { value: Appearance }) {
    if (value === 'system') {
        return (
            <div className="relative h-full w-full">
                <div className="absolute inset-0">
                    <Mini p={light} />
                </div>
                <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}>
                    <Mini p={dark} />
                </div>
            </div>
        );
    }
    return <Mini p={value === 'dark' ? dark : light} />;
}

const options: { value: Appearance; label: string; hint: string }[] = [
    { value: 'light', label: 'Terang', hint: 'Latar terang setiap saat' },
    { value: 'dark', label: 'Gelap', hint: 'Latar gelap setiap saat' },
    { value: 'system', label: 'Sistem', hint: 'Ikuti pengaturan perangkat' },
];

export default function AppearanceToggleTab({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <Card className={className} {...props}>
            <CardContent className="p-5 md:p-6">
                <div role="radiogroup" aria-label="Tema tampilan" className="grid gap-4 sm:grid-cols-3">
                    {options.map(({ value, label, hint }) => {
                        const selected = appearance === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => updateAppearance(value)}
                                className={cn(
                                    'rounded-lg border bg-background p-2 text-left transition-[box-shadow,border-color] duration-150 motion-reduce:transition-none',
                                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    selected ? 'border-transparent ring-2 ring-primary' : 'hover:border-foreground/30',
                                )}
                            >
                                <div className="aspect-[16/10] overflow-hidden rounded-md border">
                                    <Preview value={value} />
                                </div>
                                <div className="px-1 pt-3 pb-1">
                                    <div className="text-sm font-medium">{label}</div>
                                    <div className="text-xs text-muted-foreground">{hint}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
