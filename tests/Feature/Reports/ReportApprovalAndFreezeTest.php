<?php

use App\Enums\AccountType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\FrozenReport;
use App\Models\Fund;
use App\Models\ReportApproval;
use App\Models\ReportSignatory;
use App\Models\User;
use App\Services\LedgerService;
use App\Services\ReportFreezeService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');
    ChurchSetting::current();
});

it('allows user to upload and draw signature stored privately', function () {
    $user = actingAsRole(Role::Bendahara);

    // 1. Upload signature image
    $file = UploadedFile::fake()->create('signature.png', 10, 'image/png');
    $response = $this->post(route('settings.signature.update'), [
        'signature' => $file,
    ]);

    $response->assertRedirect();
    $user->refresh();
    expect($user->signature_path)->not->toBeNull();
    Storage::disk('local')->assertExists($user->signature_path);

    // 2. Upload drawn signature from canvas (base64)
    $base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    $response2 = $this->post(route('settings.signature.update'), [
        'signature_data' => $base64Png,
    ]);

    $response2->assertRedirect();
    $user->refresh();
    expect($user->signature_path)->not->toBeNull();
    Storage::disk('local')->assertExists($user->signature_path);
});

it('allows admin to manage signatories structure', function () {
    actingAsRole(Role::Admin);

    // Create signatory slot
    $response = $this->post(route('admin.signatures.store'), [
        'title' => 'Dibuat oleh',
        'position' => 'Bendahara Jemaat',
        'role' => Role::Bendahara->value,
        'order' => 1,
    ]);

    $response->assertRedirect();
    expect(ReportSignatory::count())->toBe(1);
    $sig = ReportSignatory::first();
    expect($sig->title)->toBe('Dibuat oleh')
        ->and($sig->position)->toBe('Bendahara Jemaat')
        ->and($sig->role)->toBe(Role::Bendahara->value)
        ->and($sig->order)->toBe(1);

    // Update signatory slot
    $this->put(route('admin.signatures.update', $sig), [
        'title' => 'Dibuat & Disiapkan oleh',
        'position' => 'Bendahara Umum',
        'role' => Role::Bendahara->value,
        'order' => 1,
    ])->assertRedirect();

    $sig->refresh();
    expect($sig->title)->toBe('Dibuat & Disiapkan oleh');

    // Toggle active
    $this->patch(route('admin.signatures.toggle', $sig))->assertRedirect();
    $sig->refresh();
    expect($sig->is_active)->toBeFalse();
});

it('manages report approval workflow and freezes report upon all signatories approval', function () {
    // 1. Setup Church Setting stamp
    $setting = ChurchSetting::current();
    $stampFile = UploadedFile::fake()->create('stamp.png', 10, 'image/png');
    $stampPath = $stampFile->store('stamps', 'local');
    $setting->update(['stamp_path' => $stampPath]);

    // 2. Setup Users with signatures
    $bendahara = User::factory()->create(['name' => 'Budi Bendahara']);
    $bendahara->assignRole(Role::Bendahara->value);
    $sigFile1 = UploadedFile::fake()->create('sig1.png', 10, 'image/png');
    $bendahara->update(['signature_path' => $sigFile1->store('signatures', 'local')]);

    $majelis = User::factory()->create(['name' => 'Pnt. Yohanes']);
    $majelis->assignRole(Role::Majelis->value);
    $sigFile2 = UploadedFile::fake()->create('sig2.png', 10, 'image/png');
    $majelis->update(['signature_path' => $sigFile2->store('signatures', 'local')]);

    // 3. Setup Signatories: Bendahara & Majelis
    ReportSignatory::create([
        'title' => 'Dibuat oleh',
        'position' => 'Bendahara',
        'role' => Role::Bendahara->value,
        'order' => 1,
        'is_active' => true,
    ]);
    ReportSignatory::create([
        'title' => 'Disetujui oleh',
        'position' => 'Ketua Majelis',
        'role' => Role::Majelis->value,
        'order' => 2,
        'is_active' => true,
    ]);

    // 4. Setup dummy ledger transaction
    $kas = Account::create(['code' => 'KAS-1', 'name' => 'Kas Tunai', 'type' => AccountType::Cash, 'is_active' => true]);
    $fund = Fund::create(['code' => 'F-1', 'name' => 'Dana Umum', 'is_active' => true]);
    $cat = Category::create(['name' => 'Kolekte', 'direction' => Direction::In, 'default_fund_id' => $fund->id, 'is_active' => true]);
    LedgerService::record([
        'entry_date' => '2026-10-15',
        'account_id' => $kas->id,
        'fund_id' => $fund->id,
        'category_id' => $cat->id,
        'amount' => 3_000_000,
        'direction' => Direction::In,
        'description' => 'Persembahan',
    ]);

    // 5. Bendahara initiates a report for approval
    $freezeService = app(ReportFreezeService::class);
    $report = $freezeService->initiate([
        'title' => 'Laporan Kas Oktober 2026',
        'period_type' => 'bulanan',
        'start_date' => '2026-10-01',
        'end_date' => '2026-10-31',
    ], $bendahara);

    expect($report->status)->toBe(FrozenReport::STATUS_PENDING)
        ->and($report->approvals)->toHaveCount(2)
        ->and($report->isFrozen())->toBeFalse()
        ->and($report->verification_code)->not->toBeEmpty();

    $approvalBendahara = $report->approvals->firstWhere('order', 1);
    $approvalMajelis = $report->approvals->firstWhere('order', 2);

    // 6. Anti-impersonation: Unauthorized user cannot sign for Bendahara
    $stranger = actingAsRole(Role::Penghitung);
    $responseFail = $this->post(route('reports.approve', [$report, $approvalBendahara]));
    $responseFail->assertForbidden();

    // 7. Bendahara approves their slot
    $this->actingAs($bendahara);
    $responseBendahara = $this->post(route('reports.approve', [$report, $approvalBendahara]));
    $responseBendahara->assertRedirect();

    $approvalBendahara->refresh();
    expect($approvalBendahara->status)->toBe(ReportApproval::STATUS_APPROVED)
        ->and($approvalBendahara->signer_name)->toBe('Budi Bendahara')
        ->and($approvalBendahara->signature_path)->toBe($bendahara->signature_path);

    // Report should still be pending because Majelis has not approved yet
    $report->refresh();
    expect($report->status)->toBe(FrozenReport::STATUS_PENDING)
        ->and($report->isFrozen())->toBeFalse();

    // 8. Majelis approves their slot
    $this->actingAs($majelis);
    $responseMajelis = $this->post(route('reports.approve', [$report, $approvalMajelis]));
    $responseMajelis->assertRedirect();

    // Now all signatories have approved -> Report must be FROZEN!
    $report->refresh();
    expect($report->status)->toBe(FrozenReport::STATUS_APPROVED)
        ->and($report->isFrozen())->toBeTrue()
        ->and($report->frozen_at)->not->toBeNull()
        ->and($report->pdf_path)->not->toBeNull()
        ->and($report->sha256_hash)->not->toBeNull()
        ->and(strlen($report->sha256_hash))->toBe(64);

    // PDF must exist in storage and hash must match
    Storage::disk('local')->assertExists($report->pdf_path);
    $pdfContent = Storage::disk('local')->get($report->pdf_path);
    expect(hash('sha256', $pdfContent))->toBe($report->sha256_hash);

    // 9. Freezing Guarantee: Future ledger transactions do NOT alter snapshot
    LedgerService::record([
        'entry_date' => '2026-10-20',
        'account_id' => $kas->id,
        'fund_id' => $fund->id,
        'category_id' => $cat->id,
        'amount' => 99_000_000,
        'direction' => Direction::In,
        'description' => 'Late transaction',
    ]);

    $report->refresh();
    expect($report->data_snapshot['incomes']['total'])->toBe(3_000_000);
});

it('renders reports index, bulletin, and exports bulletin pdf', function () {
    actingAsRole(Role::Bendahara);

    $this->get(route('reports.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('reports/index')->has('period')->has('live_data'));

    $this->get(route('reports.bulletin'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('reports/bulletin')->has('period_label'));

    $bulletinPdf = $this->get(route('reports.bulletin.pdf'));
    $bulletinPdf->assertOk();
    expect($bulletinPdf->headers->get('content-type'))->toBe('application/pdf');
});

it('allows bendahara to initiate report via controller and view show and pdf routes', function () {
    $bendahara = actingAsRole(Role::Bendahara);

    $kas = Account::create(['code' => 'K-10', 'name' => 'Kas', 'type' => AccountType::Cash, 'is_active' => true]);
    $fund = Fund::create(['code' => 'F-10', 'name' => 'Dana', 'is_active' => true]);
    $cat = Category::create(['name' => 'Kolekte', 'direction' => Direction::In, 'default_fund_id' => $fund->id, 'is_active' => true]);

    $response = $this->post(route('reports.store'), [
        'title' => 'Laporan Bulanan November 2026',
        'period_type' => 'bulanan',
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-30',
    ]);

    $response->assertRedirect();
    $report = FrozenReport::where('title', 'Laporan Bulanan November 2026')->first();
    expect($report)->not->toBeNull();

    // Show view
    $this->get(route('reports.show', $report))->assertOk()
        ->assertInertia(fn ($page) => $page->component('reports/show')->has('report'));

    // PDF preview
    $pdf = $this->get(route('reports.pdf', $report));
    $pdf->assertOk();
    expect($pdf->headers->get('content-type'))->toBe('application/pdf');

    // Non-bendahara cannot initiate report
    actingAsRole(Role::Penghitung);
    $this->post(route('reports.store'), [
        'title' => 'Laporan Tidak Sah',
        'period_type' => 'bulanan',
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-30',
    ])->assertForbidden();
});
