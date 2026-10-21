import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatRupiah } from '@/lib/money';
import { formatDate, formatDateTime } from '@/lib/date';
import { Head } from '@inertiajs/react';
import { CheckCircle2, Download, FileCheck2, ShieldCheck } from 'lucide-react';

interface ReportVerificationProps {
    report: {
        id: number;
        title: string;
        period_type: string;
        start_date: string;
        end_date: string;
        verification_code: string;
        sha256_hash: string;
        frozen_at: string;
        summary: {
            total_opening?: number;
            total_income?: number;
            total_expense?: number;
            total_closing?: number;
        };
        approvals: Array<{
            id: number;
            title: string;
            position: string;
            signer_name: string;
            approved_at: string;
        }>;
    };
    church: {
        name: string;
        address?: string;
        city?: string;
        phone?: string;
        email?: string;
        logo_url?: string;
    };
}

export default function ReportVerify({ report, church }: ReportVerificationProps) {
    return (
        <div className="min-h-screen bg-muted/60 py-10 px-4 sm:px-6 lg:px-8">
            <Head title={`Verifikasi: ${report.title}`} />

            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header Card */}
                <Card className="border-income/30 bg-card shadow-sm">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-income/10 text-income">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <Badge className="mx-auto border-income/30 bg-income/10 text-income">
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Dokumen Resmi &amp; Terverifikasi
                        </Badge>
                        <CardTitle className="text-xl font-bold mt-3 text-foreground">
                            {church.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {church.address} {church.city ? `• ${church.city}` : ''}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="rounded-lg bg-muted/60 p-4 border border-border">
                            <div className="text-center">
                                <h3 className="text-base font-semibold text-foreground">
                                    {report.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Periode: {formatDate(report.start_date)} s/d {formatDate(report.end_date)}
                                </p>
                            </div>

                            <Separator className="my-3" />

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Kode Verifikasi</span>
                                    <span className="font-mono font-semibold text-foreground">
                                        {report.verification_code}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Disahkan Pada</span>
                                    <span className="text-foreground font-medium">
                                        {formatDateTime(report.frozen_at)}
                                    </span>
                                </div>
                                {report.summary.total_closing !== undefined && (
                                    <div className="col-span-2 mt-1 rounded bg-card p-2.5 border border-border">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Posisi Saldo Kas Akhir</span>
                                            <span className="font-bold tabular-nums text-foreground">
                                                {formatRupiah(report.summary.total_closing)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Signatures List */}
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Penanda Tangan Dokumen
                            </h4>
                            <div className="space-y-2">
                                {report.approvals.map((approval) => (
                                    <div
                                        key={approval.id}
                                        className="flex items-center justify-between rounded-md border p-3 text-sm bg-card"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-info/10 text-info">
                                                <FileCheck2 className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">
                                                    {approval.signer_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {approval.title} • {approval.position}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            {formatDateTime(approval.approved_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tamper-evident Checksum */}
                        <div className="rounded-md bg-muted/60 p-3 text-xs">
                            <span className="text-muted-foreground block mb-1">Integritas Kriptografi (SHA-256 Checksum):</span>
                            <div className="font-mono break-all text-muted-foreground select-all">
                                {report.sha256_hash}
                            </div>
                        </div>

                        {/* Download Official PDF */}
                        <div className="pt-2">
                            <Button className="w-full" size="lg" asChild>
                                <a href={route('reports.verify.download', report.verification_code)} download>
                                    <Download className="mr-2 h-4 w-4" />
                                    Unduh Dokumen PDF Resmi
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
