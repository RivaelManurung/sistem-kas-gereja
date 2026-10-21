<?php

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\CountSheet;
use App\Models\Donation;
use App\Models\Fund;
use App\Models\Member;

beforeEach(function () {
    $this->account = Account::create([
        'code' => 'KAS-IBADAH',
        'name' => 'Kas Tunai Ibadah',
        'type' => 'cash',
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Dana Umum',
    ]);

    $this->perpuluhan = Category::create([
        'name' => 'Perpuluhan',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'allows_named' => true,
    ]);

    $this->kolekteBiasa = Category::create([
        'name' => 'Kolekte Biasa',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'allows_named' => false,
    ]);

    $this->member = Member::create([
        'membership_number' => 'JMT-0001',
        'name' => 'Budi Santoso',
        'phone' => '081234567890',
    ]);

    $this->user = actingAsRole(Role::Penghitung);

    // Create a count sheet with perpuluhan = 1,000,000
    $this->sheet = CountSheet::create([
        'type' => CountSheetType::Service,
        'account_id' => $this->account->id,
        'date' => '2026-10-25',
        'status' => CountSheetStatus::Draft,
        'total_amount' => 1000000,
        'created_by' => $this->user->id,
    ]);

    $this->sheet->lines()->create([
        'category_id' => $this->perpuluhan->id,
        'is_cash' => true,
        'denomination_counts' => ['100000' => 10],
        'amount' => 1000000,
    ]);
});

it('rejects named donation for category that does not allow named donations', function () {
    actingAsRole(Role::Penghitung);

    $response = $this->post(route('donations.store'), [
        'count_sheet_id' => $this->sheet->id,
        'category_id' => $this->kolekteBiasa->id,
        'amount' => 100000,
        'member_id' => $this->member->id,
    ]);

    $response->assertSessionHasErrors(['category_id']);
});

it('creates named donation and generates receipt number', function () {
    actingAsRole(Role::Penghitung);

    $response = $this->post(route('donations.store'), [
        'count_sheet_id' => $this->sheet->id,
        'category_id' => $this->perpuluhan->id,
        'amount' => 500000,
        'member_id' => $this->member->id,
        'notes' => 'Perpuluhan Oktober 2026',
    ]);

    $response->assertRedirect();

    $donation = Donation::first();
    expect($donation)->not->toBeNull()
        ->and($donation->amount)->toBe(500000)
        ->and($donation->receipt_number)->toStartWith('RCP-')
        ->and($donation->member_id)->toBe($this->member->id);
});

it('rejects named donations whose total exceeds count sheet subtotal for that category', function () {
    actingAsRole(Role::Penghitung);

    // First donation of 800,000 succeeds (out of 1,000,000)
    $this->post(route('donations.store'), [
        'count_sheet_id' => $this->sheet->id,
        'category_id' => $this->perpuluhan->id,
        'amount' => 800000,
        'member_id' => $this->member->id,
    ])->assertRedirect();

    // Second donation of 300,000 would bring total to 1,100,000 > 1,000,000 subtotal, so it must be rejected!
    $response = $this->post(route('donations.store'), [
        'count_sheet_id' => $this->sheet->id,
        'category_id' => $this->perpuluhan->id,
        'amount' => 300000,
        'donor_name' => 'Anonim',
    ]);

    $response->assertSessionHasErrors(['amount']);
});
