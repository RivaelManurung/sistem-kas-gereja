<?php

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\CountConfirmation;
use App\Models\CountSheet;
use App\Models\Fund;
use App\Models\ServiceSession;

beforeEach(function () {
    $this->setting = ChurchSetting::current();
    $this->setting->update([
        'min_confirmations_service' => 2,
    ]);

    $this->account = Account::create([
        'code' => 'KAS-IBADAH',
        'name' => 'Kas Tunai Ibadah',
        'type' => 'cash',
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Dana Umum',
    ]);

    $this->kolekte = Category::create([
        'name' => 'Kolekte',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
    ]);

    $this->creator = actingAsRole(Role::Penghitung);

    $this->session = ServiceSession::create([
        'name' => 'Ibadah Raya 1',
        'date' => '2026-10-25',
    ]);

    $this->sheet = CountSheet::create([
        'type' => CountSheetType::Service,
        'service_session_id' => $this->session->id,
        'account_id' => $this->account->id,
        'date' => '2026-10-25',
        'status' => CountSheetStatus::Draft,
        'total_amount' => 500000,
        'created_by' => $this->creator->id,
    ]);

    $this->sheet->lines()->create([
        'category_id' => $this->kolekte->id,
        'is_cash' => true,
        'amount' => 500000,
    ]);
});

it('requires multiple distinct witnesses to confirm count sheet before advancing to confirmed status', function () {
    // First witness confirms
    actingAsRole(Role::Penghitung);
    $this->post(route('counting.confirm', $this->sheet->id))->assertRedirect();

    $this->sheet->refresh();
    expect($this->sheet->confirmations)->toHaveCount(1)
        ->and($this->sheet->status)->toBe(CountSheetStatus::Draft);

    // Second witness confirms
    actingAsRole(Role::Penghitung);
    $this->post(route('counting.confirm', $this->sheet->id))->assertRedirect();

    $this->sheet->refresh();
    expect($this->sheet->confirmations)->toHaveCount(2)
        ->and($this->sheet->status)->toBe(CountSheetStatus::Confirmed);
});

it('prevents same user from confirming more than once', function () {
    $user = actingAsRole(Role::Penghitung);

    $this->post(route('counting.confirm', $this->sheet->id))->assertRedirect();
    $this->post(route('counting.confirm', $this->sheet->id))->assertSessionHasErrors(['user']);

    expect(CountConfirmation::where('count_sheet_id', $this->sheet->id)->count())->toBe(1);
});

it('resets confirmations to draft when count sheet is edited', function () {
    // 2 confirmations
    actingAsRole(Role::Penghitung);
    $this->post(route('counting.confirm', $this->sheet->id));
    actingAsRole(Role::Penghitung);
    $this->post(route('counting.confirm', $this->sheet->id));

    $this->sheet->refresh();
    expect($this->sheet->status)->toBe(CountSheetStatus::Confirmed);

    // Edit count sheet
    $this->put(route('counting.update', $this->sheet->id), [
        'type' => CountSheetType::Service->value,
        'service_session_id' => $this->sheet->service_session_id,
        'account_id' => $this->account->id,
        'date' => '2026-10-25',
        'lines' => [
            [
                'category_id' => $this->kolekte->id,
                'is_cash' => true,
                'denomination_counts' => ['100000' => 6], // changed from 500k to 600k
            ],
        ],
    ])->assertRedirect();

    $this->sheet->refresh();
    expect($this->sheet->status)->toBe(CountSheetStatus::Draft)
        ->and($this->sheet->confirmations)->toHaveCount(0);
});

it('allows bendahara to verify a confirmed count sheet', function () {
    // Confirm with 2 witnesses
    actingAsRole(Role::Penghitung);
    $this->post(route('counting.confirm', $this->sheet->id));
    actingAsRole(Role::Penghitung);
    $this->post(route('counting.confirm', $this->sheet->id));

    // Bendahara verifies
    actingAsRole(Role::Bendahara);
    $this->post(route('counting.verify', $this->sheet->id))->assertRedirect();

    $this->sheet->refresh();
    expect($this->sheet->status)->toBe(CountSheetStatus::Verified);
});
