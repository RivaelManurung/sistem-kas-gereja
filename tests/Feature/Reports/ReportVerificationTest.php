<?php

use App\Enums\Role;
use App\Models\ChurchSetting;
use App\Models\FrozenReport;
use App\Models\ReportApproval;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    ChurchSetting::current();
});

it('allows public verification of a frozen report without login', function () {
    $creator = User::factory()->create(['name' => 'Bendahara Jemaat']);
    $creator->assignRole(Role::Bendahara->value);

    // Create dummy PDF in storage
    $pdfPath = 'reports/test_report.pdf';
    $dummyPdf = '%PDF-1.4 dummy content';
    Storage::disk('local')->put($pdfPath, $dummyPdf);
    $hash = hash('sha256', $dummyPdf);

    $report = FrozenReport::create([
        'title' => 'Laporan Keuangan Triwulan 3 2026',
        'period_type' => 'triwulan',
        'start_date' => '2026-07-01',
        'end_date' => '2026-09-30',
        'status' => FrozenReport::STATUS_APPROVED,
        'data_snapshot' => [
            'period' => ['formatted' => '01 Jul 2026 - 30 Sep 2026'],
            'summary' => ['total_closing' => 25_000_000],
        ],
        'pdf_path' => $pdfPath,
        'sha256_hash' => $hash,
        'verification_code' => 'VERIFY-12345678',
        'created_by' => $creator->id,
        'frozen_at' => now(),
    ]);

    ReportApproval::create([
        'frozen_report_id' => $report->id,
        'signatory_title' => 'Dibuat oleh',
        'signatory_position' => 'Bendahara',
        'signer_name' => 'Bendahara Jemaat',
        'status' => ReportApproval::STATUS_APPROVED,
        'approved_at' => now(),
        'order' => 1,
    ]);

    // Public request without authentication
    $response = $this->get(route('reports.verify', 'VERIFY-12345678'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/verify')
        ->has('report', fn ($prop) => $prop
            ->where('title', 'Laporan Keuangan Triwulan 3 2026')
            ->where('verification_code', 'VERIFY-12345678')
            ->where('sha256_hash', $hash)
            ->etc()
        )
        ->has('church')
    );

    // Download verified PDF
    $download = $this->get(route('reports.verify.download', 'VERIFY-12345678'));
    $download->assertOk();
});

it('returns 404 for invalid verification code', function () {
    $response = $this->get(route('reports.verify', 'INVALID-CODE'));
    $response->assertNotFound();
});
