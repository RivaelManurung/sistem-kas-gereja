<?php

namespace App\Services;

use App\Models\ChurchSetting;
use App\Models\FrozenReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PdfReportService
{
    /**
     * Render the official frozen financial report to PDF binary string.
     */
    public function renderOfficialReport(FrozenReport $report): string
    {
        $church = ChurchSetting::current();
        $report->loadMissing(['approvals.user']);

        $approvalsData = $report->approvals->map(function ($approval) {
            $signatureBase64 = null;
            if ($approval->status === 'approved' && $approval->signature_path && Storage::disk('local')->exists($approval->signature_path)) {
                $signatureBase64 = 'data:image/png;base64,'.base64_encode(Storage::disk('local')->get($approval->signature_path));
            }

            return [
                'id' => $approval->id,
                'title' => $approval->signatory_title,
                'position' => $approval->signatory_position,
                'signer_name' => $approval->signer_name ?? $approval->user?->name ?? '—',
                'status' => $approval->status,
                'approved_at' => $approval->approved_at?->translatedFormat('d F Y H:i'),
                'signature_base64' => $signatureBase64,
            ];
        });

        $data = [
            'church' => [
                'name' => $church->name ?? 'Gereja',
                'address' => $church->address,
                'city' => $church->city,
                'phone' => $church->phone,
                'email' => $church->email,
                'logo_base64' => $church->getLogoBase64(),
                'stamp_base64' => $church->getStampBase64(),
            ],
            'report' => [
                'title' => $report->title,
                'period_type' => $report->period_type,
                'start_date' => $report->start_date->translatedFormat('d F Y'),
                'end_date' => $report->end_date->translatedFormat('d F Y'),
                'verification_code' => $report->verification_code,
                'sha256_hash' => $report->sha256_hash,
                'frozen_at' => $report->frozen_at?->translatedFormat('d F Y H:i:s'),
                'status' => $report->status,
            ],
            'data' => $report->data_snapshot,
            'approvals' => $approvalsData,
            'is_frozen' => $report->isFrozen(),
            'stamp_applied' => $report->isFrozen() && ! empty($church->stamp_path),
            'verification_url' => url('/verify-report/'.$report->verification_code),
        ];

        $pdf = Pdf::loadView('pdf.financial_report', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif',
            ]);

        return $pdf->output();
    }

    /**
     * Render the 1-page condensed congregational weekly bulletin (Warta Mingguan) to PDF binary string.
     */
    public function renderBulletin(array $bulletinData): string
    {
        $church = ChurchSetting::current();

        $data = array_merge($bulletinData, [
            'church' => [
                'name' => $church->name ?? 'Gereja',
                'address' => $church->address,
                'city' => $church->city,
                'phone' => $church->phone,
                'email' => $church->email,
                'logo_base64' => $church->getLogoBase64(),
            ],
        ]);

        $pdf = Pdf::loadView('pdf.weekly_bulletin', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif',
            ]);

        return $pdf->output();
    }
}
