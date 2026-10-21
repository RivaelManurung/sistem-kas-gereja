<?php

namespace App\Http\Controllers;

use App\Models\ChurchSetting;
use App\Models\FrozenReport;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportVerificationController extends Controller
{
    /**
     * Public page to verify the authenticity and tamper-evident hash of a frozen report.
     */
    public function verify(string $code): Response
    {
        $report = FrozenReport::with(['approvals.user', 'creator'])
            ->where('verification_code', $code)
            ->where('status', FrozenReport::STATUS_APPROVED)
            ->firstOrFail();

        $church = ChurchSetting::current();

        return Inertia::render('reports/verify', [
            'report' => [
                'id' => $report->id,
                'title' => $report->title,
                'period_type' => $report->period_type,
                'start_date' => $report->start_date->translatedFormat('d F Y'),
                'end_date' => $report->end_date->translatedFormat('d F Y'),
                'verification_code' => $report->verification_code,
                'sha256_hash' => $report->sha256_hash,
                'frozen_at' => $report->frozen_at?->translatedFormat('d F Y H:i:s'),
                'summary' => $report->data_snapshot['summary'] ?? [],
                'approvals' => $report->approvals->map(fn ($app) => [
                    'id' => $app->id,
                    'title' => $app->signatory_title,
                    'position' => $app->signatory_position,
                    'signer_name' => $app->signer_name,
                    'approved_at' => $app->approved_at?->translatedFormat('d F Y H:i'),
                ]),
            ],
            'church' => [
                'name' => $church->name ?? 'Gereja',
                'address' => $church->address,
                'city' => $church->city,
                'phone' => $church->phone,
                'email' => $church->email,
                'logo_url' => $church->logo_path ? Storage::disk('public')->url($church->logo_path) : null,
            ],
        ]);
    }

    /**
     * Public download of the frozen verified official PDF document.
     */
    public function download(string $code): StreamedResponse|HttpResponse
    {
        $report = FrozenReport::where('verification_code', $code)
            ->where('status', FrozenReport::STATUS_APPROVED)
            ->firstOrFail();

        if (! $report->pdf_path || ! Storage::disk('local')->exists($report->pdf_path)) {
            abort(404, 'File PDF laporan tidak ditemukan.');
        }

        $content = Storage::disk('local')->get($report->pdf_path);
        $filename = 'Laporan-'.preg_replace('/[^A-Za-z0-9_\-]/', '_', $report->title).'-'.$report->verification_code.'.pdf';

        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, $filename, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }
}
