import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatRupiah } from '@/lib/money';
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
        <div className="min-h-screen bg-slate-50 py-10 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
            <Head title={`Verifikasi: ${report.title}`} />

            <div className="mx-auto max-w-2xl space-y-6">
                {/* Header Card */}
                <Card className="border-emerald-200 bg-white shadow-sm dark:border-emerald-900 dark:bg-slate-900">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <Badge className="mx-auto bg-emerald-600 text-white hover:bg-emerald-700">
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Dokumen Resmi &amp; Terverifikasi
                        </Badge>
                        <CardTitle className="text-xl font-bold mt-3 text-slate-900 dark:text-slate-100">
                            {church.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {church.address} {church.city ? `• ${church.city}` : ''}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                            <div className="text-center">
                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                    {report.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Periode: {report.start_date} s/d {report.end_date}
                                </p>
                            </div>

                            <Separator className="my-3" />

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Kode Verifikasi</span>
                                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                        {report.verification_code}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">Disahkan Pada</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                                        {report.frozen_at}
                                    </span>
                                </div>
                                {report.summary.total_closing !== undefined && (
                                    <div className="col-span-2 mt-1 rounded bg-white p-2.5 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Posisi Saldo Kas Akhir</span>
                                            <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
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
                                        className="flex items-center justify-between rounded-md border p-3 text-sm bg-white dark:bg-slate-900"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                                <FileCheck2 className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                    {approval.signer_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {approval.title} • {approval.position}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            {approval.approved_at}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tamper-evident Checksum */}
                        <div className="rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-800">
                            <span className="text-muted-foreground block mb-1">Integritas Kriptografi (SHA-256 Checksum):</span>
                            <div className="font-mono break-all text-slate-700 dark:text-slate-300 select-all">
                                {report.sha256_hash}
                            </div>
                        </div>

                        {/* Download Official PDF */}
                        <div className="pt-2">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" asChild>
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
