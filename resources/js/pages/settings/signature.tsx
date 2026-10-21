import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Check, CheckCircle2, Eraser, FileSignature, PenTool, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengaturan', href: '/settings/profile' },
    { title: 'Tanda Tangan Digital', href: '/settings/signature' },
];

export default function SignatureSettings({
    has_signature,
    signature_url,
}: {
    has_signature: boolean;
    signature_url?: string | null;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const saveCanvasSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return;

        setIsSaving(true);
        const dataUrl = canvas.toDataURL('image/png');

        router.post(
            route('settings.signature.update'),
            { signature_data: dataUrl },
            {
                onFinish: () => {
                    setIsSaving(false);
                    clearCanvas();
                },
            }
        );
    };

    const saveFileSignature = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;

        setIsSaving(true);
        const data = new FormData();
        data.append('signature', uploadFile);

        router.post(route('settings.signature.update'), data, {
            onFinish: () => {
                setIsSaving(false);
                setUploadFile(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tanda Tangan Digital Akun" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Tanda Tangan Digital Akun"
                        description="Tanda tangan ini digunakan saat Anda menandatangani dan mengesahkan laporan keuangan resmi gereja."
                    />

                    {/* Current Signature Preview */}
                    <Card className="bg-white dark:bg-slate-900">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span>Tanda Tangan Saat Ini</span>
                                {has_signature && (
                                    <span className="text-xs text-emerald-600 font-normal flex items-center">
                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Terdaftar &amp; Siap Digunakan
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center items-center h-28 rounded-lg border border-dashed bg-slate-50 dark:bg-slate-800/40 p-4">
                                {signature_url ? (
                                    <img src={signature_url} alt="Tanda Tangan" className="max-h-20 object-contain" />
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">
                                        Anda belum memiliki tanda tangan terdaftar. Buat atau unggah di bawah ini.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Methods: Draw or Upload */}
                    <Card className="bg-white dark:bg-slate-900">
                        <CardContent className="pt-6">
                            <Tabs defaultValue="draw">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="draw" className="flex items-center">
                                        <PenTool className="mr-1.5 h-4 w-4" />
                                        Gambar di Layar (Canvas)
                                    </TabsTrigger>
                                    <TabsTrigger value="upload" className="flex items-center">
                                        <Upload className="mr-1.5 h-4 w-4" />
                                        Unggah Berkas Gambar
                                    </TabsTrigger>
                                </TabsList>

                                {/* Canvas Drawing Tab */}
                                <TabsContent value="draw" className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-xs text-muted-foreground">
                                            Gunakan kursor mouse atau sentuhan jari/stylus di area kanvas berikut:
                                        </div>
                                        <div className="rounded-lg border-2 border-slate-300 bg-white dark:bg-slate-100 flex justify-center">
                                            <canvas
                                                ref={canvasRef}
                                                width={450}
                                                height={180}
                                                className="cursor-crosshair touch-none"
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={clearCanvas}
                                            disabled={!hasDrawn}
                                        >
                                            <Eraser className="mr-1.5 h-4 w-4" />
                                            Hapus / Ulangi
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={saveCanvasSignature}
                                            disabled={!hasDrawn || isSaving}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Check className="mr-1.5 h-4 w-4" />
                                            {isSaving ? 'Menyimpan...' : 'Simpan Tanda Tangan Ini'}
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* File Upload Tab */}
                                <TabsContent value="upload" className="space-y-4">
                                    <form onSubmit={saveFileSignature} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sig_file" className="text-xs">
                                                Pilih Foto / Gambar Tanda Tangan (PNG disarankan, transparan, max 2MB)
                                            </Label>
                                            <Input
                                                id="sig_file"
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={!uploadFile || isSaving}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Upload className="mr-1.5 h-4 w-4" />
                                                {isSaving ? 'Mengunggah...' : 'Unggah & Simpan'}
                                            </Button>
                                        </div>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
