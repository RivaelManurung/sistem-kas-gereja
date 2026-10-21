<?php

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\AllocationRule;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\CountSheet;
use App\Models\Event;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\User;

beforeEach(function () {
    $this->setting = ChurchSetting::create([
        'name' => 'Gereja Uji',
        'min_confirmations_service' => 2,
        'min_confirmations_event' => 3, // Set to 3 for testing
        'min_confirmations_general' => 2,
    ]);

    $this->account = Account::create([
        'code' => 'KAS-TUNAI',
        'name' => 'Kas Tunai Utama',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $this->event = Event::create([
        'name' => 'Bazaar Natal 2026',
        'start_date' => '2026-12-15',
    ]);

    $this->category = Category::create([
        'name' => 'Kupon Bazaar',
        'direction' => Direction::In,
        'default_fund_id' => $this->event->fund_id,
        'scope_event_id' => $this->event->id,
    ]);
});

it('creates an event count sheet and links to event', function () {
    $user = actingAsRole(Role::Penghitung);

    $response = $this->post(route('counting.store'), [
        'type' => CountSheetType::Event->value,
        'event_id' => $this->event->id,
        'account_id' => $this->account->id,
        'date' => '2026-12-15',
        'notes' => 'Penjualan kupon bazaar hari ke-1',
        'idempotency_key' => 'evt-cs-001',
        'lines' => [
            [
                'category_id' => $this->category->id,
                'is_cash' => true,
                'denomination_counts' => [
                    100000 => 50, // 5.000.000
                    50000 => 20,  // 1.000.000
                ],
            ],
        ],
    ]);

    $response->assertRedirect();
    $sheet = CountSheet::where('idempotency_key', 'evt-cs-001')->first();

    expect($sheet)->not->toBeNull()
        ->and($sheet->type)->toBe(CountSheetType::Event)
        ->and($sheet->event_id)->toBe($this->event->id)
        ->and($sheet->total_amount)->toBe(6000000)
        ->and($sheet->status)->toBe(CountSheetStatus::Draft);
});

it('enforces min_confirmations_event for event count sheets', function () {
    $creator = actingAsRole(Role::Penghitung);

    $sheet = CountSheet::create([
        'type' => CountSheetType::Event,
        'event_id' => $this->event->id,
        'account_id' => $this->account->id,
        'date' => '2026-12-15',
        'status' => CountSheetStatus::Draft,
        'total_amount' => 1500000,
        'created_by' => $creator->id,
    ]);

    $sheet->lines()->create([
        'category_id' => $this->category->id,
        'is_cash' => false,
        'amount' => 1500000,
    ]);

    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $user3 = User::factory()->create();

    // Confirm 1
    $this->actingAs($user1)->post(route('counting.confirm', $sheet))->assertRedirect();
    expect($sheet->fresh()->status)->toBe(CountSheetStatus::Draft);

    // Confirm 2 (still draft because min_confirmations_event is 3)
    $this->actingAs($user2)->post(route('counting.confirm', $sheet))->assertRedirect();
    expect($sheet->fresh()->status)->toBe(CountSheetStatus::Draft);

    // Confirm 3 (now satisfies min_confirmations_event = 3)
    $this->actingAs($user3)->post(route('counting.confirm', $sheet))->assertRedirect();
    expect($sheet->fresh()->status)->toBe(CountSheetStatus::Confirmed);
});

it('posts event income directly into event dedicated fund when locked', function () {
    // Setup an allocation rule on category to ensure it is IGNORED for event count sheets!
    $pembangunanFund = Fund::create(['code' => 'PEMB', 'name' => 'Dana Pembangunan']);
    $rule = AllocationRule::create([
        'name' => 'Potongan 20% Pembangunan',
        'category_id' => $this->category->id,
        'valid_from' => '2026-01-01',
        'is_active' => true,
    ]);
    $rule->items()->create(['fund_id' => $pembangunanFund->id, 'percentage' => 20]);
    $rule->items()->create(['fund_id' => $this->event->fund_id, 'percentage' => 80]);

    $creator = User::factory()->create();
    $sheet = CountSheet::create([
        'type' => CountSheetType::Event,
        'event_id' => $this->event->id,
        'account_id' => $this->account->id,
        'date' => '2026-12-15',
        'status' => CountSheetStatus::Verified, // already verified by bendahara
        'total_amount' => 10000000,
        'created_by' => $creator->id,
    ]);

    $sheet->lines()->create([
        'category_id' => $this->category->id,
        'is_cash' => false,
        'amount' => 10000000,
    ]);

    actingAsRole(Role::Bendahara);
    $response = $this->post(route('counting.lock', $sheet));
    $response->assertRedirect();

    expect($sheet->fresh()->status)->toBe(CountSheetStatus::Locked);

    // Verify ledger entries: 100% (10.000.000) posted directly to event fund!
    $entries = LedgerEntry::where('source_type', 'count_sheet')
        ->where('source_id', $sheet->id)
        ->get();

    expect($entries)->toHaveCount(1)
        ->and($entries->first()->fund_id)->toBe($this->event->fund_id)
        ->and($entries->first()->amount)->toBe(10000000)
        ->and($entries->first()->direction)->toBe(Direction::In)
        ->and(LedgerEntry::getBalance($this->event->fund_id))->toBe(10000000);
});
