<?php

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\AllocationRule;
use App\Models\Category;
use App\Models\CountSheet;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\ServiceSession;
use App\Services\AllocationService;

beforeEach(function () {
    $this->account = Account::create([
        'code' => 'KAS-OPERASIONAL',
        'name' => 'Kas Operasional',
        'type' => 'cash',
    ]);

    $this->fundUmum = Fund::create([
        'code' => 'UMUM',
        'name' => 'Dana Operasional Umum',
    ]);

    $this->fundPembangunan = Fund::create([
        'code' => 'PEMBANGUNAN',
        'name' => 'Dana Pembangunan Gedung',
    ]);

    $this->fundDiakonia = Fund::create([
        'code' => 'DIAKONIA',
        'name' => 'Dana Pelayanan Diakonia',
    ]);

    $this->kolekte = Category::create([
        'name' => 'Kolekte Ibadah Raya',
        'direction' => Direction::In,
        'default_fund_id' => $this->fundUmum->id,
    ]);

    $this->session = ServiceSession::create([
        'name' => 'Ibadah Raya 1',
        'date' => '2026-10-25',
    ]);

    $user = actingAsRole(Role::Penghitung);

    $this->sheet = CountSheet::create([
        'type' => CountSheetType::Service,
        'service_session_id' => $this->session->id,
        'account_id' => $this->account->id,
        'date' => '2026-10-25',
        'status' => CountSheetStatus::Verified, // Ready to be locked
        'total_amount' => 1000000,
        'created_by' => $user->id,
    ]);

    $this->sheet->lines()->create([
        'category_id' => $this->kolekte->id,
        'is_cash' => true,
        'amount' => 1000000,
    ]);
});

it('allocates 100% to default fund when no allocation rule is defined', function () {
    $service = app(AllocationService::class);
    $entries = $service->apply($this->sheet);

    expect($entries)->toHaveCount(1)
        ->and($entries[0]->fund_id)->toBe($this->fundUmum->id)
        ->and($entries[0]->amount)->toBe(1000000);

    $this->sheet->refresh();
    expect($this->sheet->status)->toBe(CountSheetStatus::Locked)
        ->and($this->session->fresh()->is_completed)->toBeTrue();
});

it('splits income across funds according to active versioned rule with remainder rounding to first fund', function () {
    // Rule valid from 2026-01-01: 70% Umum, 20% Pembangunan, 10% Diakonia
    $rule = AllocationRule::create([
        'category_id' => $this->kolekte->id,
        'name' => 'Alokasi Kolekte Raya 2026',
        'valid_from' => '2026-01-01',
        'is_active' => true,
    ]);

    $rule->items()->createMany([
        ['fund_id' => $this->fundUmum->id, 'percentage' => 70.00, 'sort_order' => 1],
        ['fund_id' => $this->fundPembangunan->id, 'percentage' => 20.00, 'sort_order' => 2],
        ['fund_id' => $this->fundDiakonia->id, 'percentage' => 10.00, 'sort_order' => 3],
    ]);

    // Test with uneven amount to test rounding remainder (e.g. 100,005)
    $this->sheet->update(['total_amount' => 100005]);
    $this->sheet->lines->first()->update(['amount' => 100005]);

    $service = app(AllocationService::class);
    $entries = $service->apply($this->sheet);

    // 70% of 100,005 = 70,003.5 -> 70,003 + 1 remainder = 70,004
    // 20% of 100,005 = 20,001
    // 10% of 100,005 = 10,000.5 -> 10,000
    // Sum = 70,004 + 20,001 + 10,000 = 100,005!
    $totalAllocated = array_sum(array_column($entries, 'amount'));
    expect($totalAllocated)->toBe(100005)
        ->and($entries)->toHaveCount(3);

    $fundAllocations = collect($entries)->pluck('amount', 'fund_id');
    expect($fundAllocations[$this->fundUmum->id])->toBe(70004)
        ->and($fundAllocations[$this->fundPembangunan->id])->toBe(20001)
        ->and($fundAllocations[$this->fundDiakonia->id])->toBe(10000);
});

it('locks count sheet and posts ledger entries via controller endpoint', function () {
    actingAsRole(Role::Bendahara);

    $this->post(route('counting.lock', $this->sheet->id))
        ->assertRedirect();

    $this->sheet->refresh();
    expect($this->sheet->status)->toBe(CountSheetStatus::Locked);

    $ledgerCount = LedgerEntry::where('source_type', 'count_sheet')
        ->where('source_id', $this->sheet->id)
        ->count();

    expect($ledgerCount)->toBe(1);
});
