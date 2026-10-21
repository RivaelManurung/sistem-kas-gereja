import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout, { SettingsSection } from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
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

    const footerClass = 'justify-between gap-3 rounded-b-xl border-t bg-muted/30 px-5 py-4 md:px-6';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tanda Tangan Digital Akun" />

            <SettingsLayout>
                <SettingsSection
                    title="Tanda tangan saat ini"
                    description="Dipakai saat Anda menandatangani dan mengesahkan laporan keuangan resmi gereja."
                >
                    <Card>
                        <CardContent className="flex min-h-32 items-center p-5 md:p-6">
                            {signature_url ? (
                                <img src={signature_url} alt="Tanda tangan tersimpan" className="max-h-24 object-contain" />
                            ) : (
                                <p className="text-sm text-muted-foreground">Belum ada tanda tangan tersimpan</p>
                            )}
                        </CardContent>
                    </Card>
                </SettingsSection>

                <SettingsSection
                    title={has_signature ? 'Ganti tanda tangan' : 'Buat tanda tangan'}
                    description="Gambar langsung di layar, atau unggah gambar tanda tangan. Menyimpan akan menggantikan tanda tangan yang ada."
                >
                    <Card>
                        <Tabs defaultValue="draw">
                            <div className="p-5 pb-0 md:p-6 md:pb-0">
                                <TabsList>
                                    <TabsTrigger value="draw">Gambar di layar</TabsTrigger>
                                    <TabsTrigger value="upload">Unggah gambar</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="draw" className="mt-0">
                                <CardContent className="space-y-3 p-5 pt-4 md:p-6 md:pt-4">
                                    <p className="text-sm text-muted-foreground">Gunakan mouse, jari, atau stylus pada area di bawah.</p>
                                    {/* Tinta tanda tangan gelap, jadi kanvas selalu berlatar putih di kedua tema. */}
                                    <div className="overflow-x-auto rounded-lg border bg-white">
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
                                </CardContent>
                                <CardFooter className={footerClass}>
                                    <Button type="button" variant="outline" onClick={clearCanvas} disabled={!hasDrawn}>
                                        Ulangi
                                    </Button>
                                    <Button type="button" onClick={saveCanvasSignature} disabled={!hasDrawn || isSaving}>
                                        {isSaving ? 'Menyimpan...' : 'Simpan tanda tangan'}
                                    </Button>
                                </CardFooter>
                            </TabsContent>

                            <TabsContent value="upload" className="mt-0">
                                <form onSubmit={saveFileSignature}>
                                    <CardContent className="space-y-2 p-5 pt-4 md:p-6 md:pt-4">
                                        <Label htmlFor="sig_file">Berkas tanda tangan</Label>
                                        <Input
                                            id="sig_file"
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        />
                                        <p className="text-sm text-muted-foreground">PNG dengan latar transparan disarankan. Maksimal 2 MB.</p>
                                    </CardContent>
                                    <CardFooter className={footerClass + ' justify-end'}>
                                        <Button type="submit" disabled={!uploadFile || isSaving}>
                                            {isSaving ? 'Mengunggah...' : 'Unggah dan simpan'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </SettingsSection>
            </SettingsLayout>
        </AppLayout>
    );
}
