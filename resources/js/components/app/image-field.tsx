import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ImageFieldProps {
    id: string;
    label: string;
    hint: string;
    currentUrl: string | null;
    file: File | null;
    removed: boolean;
    onFile: (file: File) => void;
    onRemove: () => void;
    error?: string;
    accept?: string;
    previewClassName?: string;
}

/** Unggah gambar dengan pratinjau langsung, tombol ganti, dan hapus. */
export function ImageField({ id, label, hint, currentUrl, file, removed, onFile, onRemove, error, accept = 'image/png,image/jpeg,image/webp', previewClassName = 'size-16' }: ImageFieldProps) {
    const input = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const shown = removed ? null : (preview ?? currentUrl);

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-4">
                <div className={cn('bg-muted/40 flex shrink-0 items-center justify-center overflow-hidden rounded-lg border', previewClassName)}>
                    {shown ? <img src={shown} alt={`Pratinjau ${label.toLowerCase()}`} className="size-full object-contain" /> : <ImageIcon className="text-muted-foreground size-5" aria-hidden="true" />}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
                        {shown ? 'Ganti' : 'Pilih gambar'}
                    </Button>
                    {shown && (
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
                            Hapus
                        </Button>
                    )}
                </div>
                <input
                    ref={input}
                    id={id}
                    type="file"
                    accept={accept}
                    className="sr-only"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onFile(f);
                        e.target.value = '';
                    }}
                />
            </div>
            <p className="text-muted-foreground text-xs">{hint}</p>
            <InputError message={error} />
        </div>
    );
}
