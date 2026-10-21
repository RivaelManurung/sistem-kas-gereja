<?php

use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\BankDeposit;
use App\Models\Fund;
use App\Models\LedgerEntry;

beforeEach(function () {
    $this->cashAccount = Account::create([
        'code' => 'KAS-TUNAI',
        'name' => 'Kas Tunai Utama',
        'type' => 'cash',
    ]);

    $this->bankAccount = Account::create([
        'code' => 'BANK-BCA',
        'name' => 'BCA Operasional',
        'type' => 'bank',
        'bank_name' => 'Bank Central Asia',
        'account_number' => '1234567890',
        'account_holder' => 'Gereja Kas',
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Dana Umum Operasional',
    ]);

    LedgerEntry::create([
        'entry_date' => '2026-10-25',
        'account_id' => $this->cashAccount->id,
        'fund_id' => $this->fund->id,
        'amount' => 10000000,
        'direction' => Direction::In->value,
        'description' => 'Saldo awal kas tunai',
    ]);
});

it('creates bank deposit and moves money between accounts on completion', function () {
    $user = actingAsRole(Role::Bendahara);

    // Initial deposit recorded
    $response = $this->post(route('deposits.store'), [
        'deposit_date' => '2026-10-26',
        'from_account_id' => $this->cashAccount->id,
        'to_account_id' => $this->bankAccount->id,
        'amount' => 5000000,
        'reference_number' => 'DEP-20261026-001',
        'notes' => 'Setoran kolekte tunai minggu ini ke bank',
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $deposit = BankDeposit::first();
    expect($deposit)->not->toBeNull()
        ->and($deposit->status)->toBe('completed')
        ->and($deposit->amount)->toBe(5000000);

    // Two ledger entries must be posted: OUT from Cash, IN to Bank
    $entries = LedgerEntry::where('source_type', 'bank_deposit')
        ->where('source_id', $deposit->id)
        ->get();

    expect($entries)->toHaveCount(2);

    $outEntry = $entries->firstWhere('direction', Direction::Out);
    $inEntry = $entries->firstWhere('direction', Direction::In);

    expect($outEntry)->not->toBeNull()
        ->and($outEntry->account_id)->toBe($this->cashAccount->id)
        ->and($outEntry->amount)->toBe(5000000);

    expect($inEntry)->not->toBeNull()
        ->and($inEntry->account_id)->toBe($this->bankAccount->id)
        ->and($inEntry->amount)->toBe(5000000);
});

it('rejects deposit if to_account is not a bank account or is same as from_account', function () {
    actingAsRole(Role::Bendahara);

    $cashAccount2 = Account::create([
        'code' => 'KAS-KECIL',
        'name' => 'Kas Kecil',
        'type' => 'cash',
    ]);

    // to_account is cash, not bank
    $this->post(route('deposits.store'), [
        'deposit_date' => '2026-10-26',
        'from_account_id' => $this->cashAccount->id,
        'to_account_id' => $cashAccount2->id,
        'amount' => 1000000,
    ])->assertSessionHasErrors(['to_account_id']);

    // to_account same as from_account
    $this->post(route('deposits.store'), [
        'deposit_date' => '2026-10-26',
        'from_account_id' => $this->cashAccount->id,
        'to_account_id' => $this->cashAccount->id,
        'amount' => 1000000,
    ])->assertSessionHasErrors(['to_account_id']);
});
