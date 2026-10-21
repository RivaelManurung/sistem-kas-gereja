<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\FrozenReport;
use App\Models\ReportApproval;
use App\Models\ReportSignatory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportFreezeService
{
    public function __construct(
        protected FinancialReportService $reportService,
        protected PdfReportService $pdfService
    ) {}

    /**
     * Initiate a new financial report for approval.
     *
     * @param  array<string, mixed>  $params
     */
    public function initiate(array $params, User $creator): FrozenReport
    {
        return DB::transaction(function () use ($params, $creator) {
            $periodType = $params['period_type'] ?? 'bulanan';
            $startDate = $params['start_date'];
            $endDate = $params['end_date'];
            $title = $params['title'] ?? 'Laporan Keuangan';

            $snapshot = $this->reportService->generate($startDate, $endDate);
            $code = 'REP-'.now()->format('Ym').'-'.Str::upper(Str::random(8));

            $report = FrozenReport::create([
                'title' => $title,
                'period_type' => $periodType,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => FrozenReport::STATUS_PENDING,
                'data_snapshot' => $snapshot,
                'verification_code' => $code,
                'created_by' => $creator->id,
            ]);

            // Copy active signatories or fallback defaults
            $signatories = ReportSignatory::active()->get();

            if ($signatories->isEmpty()) {
                // Default setup if admin hasn't configured any
                $signatories = collect([
                    (object) ['id' => null, 'title' => 'Dibuat oleh', 'position' => 'Bendahara', 'role' => Role::Bendahara->value, 'user_id' => null, 'order' => 1],
                    (object) ['id' => null, 'title' => 'Disetujui oleh', 'position' => 'Ketua Majelis', 'role' => Role::Majelis->value, 'user_id' => null, 'order' => 2],
                ]);
            }

            foreach ($signatories as $sig) {
                ReportApproval::create([
                    'frozen_report_id' => $report->id,
                    'report_signatory_id' => $sig->id ?? null,
                    'signatory_title' => $sig->title,
                    'signatory_position' => $sig->position,
                    'role' => $sig->role,
                    'user_id' => $sig->user_id,
                    'order' => $sig->order,
                    'status' => ReportApproval::STATUS_PENDING,
                ]);
            }

            return $report->load('approvals');
        });
    }

    /**
     * Approve an approval slot by authenticated user.
     */
    public function approve(FrozenReport $report, ReportApproval $approval, User $user, ?string $notes = null): FrozenReport
    {
        return DB::transaction(function () use ($report, $approval, $user, $notes) {
            abort_if((int) $approval->frozen_report_id !== (int) $report->id, 404, 'Posisi penanda tangan tidak sesuai dengan laporan ini.');
            abort_if($report->status !== FrozenReport::STATUS_PENDING, 400, 'Laporan tidak dalam status menunggu persetujuan.');

            // Verify authority
            if ($approval->user_id) {
                abort_if($user->id !== $approval->user_id, 403, 'Anda tidak berwenang menandatangani posisi ini.');
            } elseif ($approval->role) {
                abort_if(
                    ! $user->hasRole($approval->role) && ! $user->hasRole(Role::Admin->value),
                    403,
                    'Peran akun Anda tidak berwenang untuk menandatangani posisi ini.'
                );
            } else {
                abort(403, 'Konfigurasi penanda tangan tidak valid.');
            }

            // Verify signature exists
            abort_if(
                empty($user->signature_path) || ! Storage::disk('local')->exists($user->signature_path),
                422,
                'Anda belum memiliki tanda tangan terdaftar. Silakan atur tanda tangan di profil terlebih dahulu.'
            );

            // Record approval
            $approval->update([
                'status' => ReportApproval::STATUS_APPROVED,
                'user_id' => $user->id,
                'signer_name' => $user->name,
                'signature_path' => $user->signature_path,
                'approved_at' => now(),
                'notes' => $notes,
            ]);

            // Check if all approvals are complete
            $allApproved = $report->approvals()
                ->where('status', '!=', ReportApproval::STATUS_APPROVED)
                ->count() === 0;

            if ($allApproved) {
                $this->freezeReport($report);
            }

            return $report->fresh(['approvals']);
        });
    }

    /**
     * Freeze the report: generate official PDF, calculate SHA256 checksum, lock status.
     */
    public function freezeReport(FrozenReport $report): void
    {
        $report->loadMissing(['approvals.user']);
        $report->status = FrozenReport::STATUS_APPROVED;
        $report->frozen_at = now();

        // Render official PDF
        $pdfBinary = $this->pdfService->renderOfficialReport($report);
        $pdfPath = 'reports/'.$report->verification_code.'.pdf';

        Storage::disk('local')->put($pdfPath, $pdfBinary);
        $sha256 = hash('sha256', $pdfBinary);

        $report->pdf_path = $pdfPath;
        $report->sha256_hash = $sha256;
        $report->save();
    }
}
