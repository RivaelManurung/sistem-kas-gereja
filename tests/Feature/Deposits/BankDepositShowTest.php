<?php

use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\BankDeposit;
use App\Models\Fund;
use App\Models\LedgerEntry;

function makeDeposit(int $creatorId): BankDeposit
{
    $cash = Account::create(['code' => 'KAS', 'name' => 'Kas Tunai', 'type' => 'cash']);
    $bank = Account::create(['code' => 'BCA', 'name' => 'BCA Operasional', 'type' => 'bank']);
    $fund = Fund::create(['code' => 'UMUM', 'name' => 'Dana Umum']);

    $deposit = BankDeposit::create([
        'deposit_date' => '2026-10-20',
        'from_account_id' => $cash->id,
        'to_account_id' => $bank->id,
        'amount' => 500000,
        'reference_number' => 'REF-1',
        'status' => 'completed',
        'created_by' => $creatorId,
    ]);

    foreach ([[$cash, Direction::Out], [$bank, Direction::In]] as [$account, $dir]) {
        LedgerEntry::create([
            'entry_date' => '2026-10-20',
            'account_id' => $account->id,
            'fund_id' => $fund->id,
            'amount' => 500000,
            'direction' => $dir->value,
            'description' => 'Setoran Bank',
            'source_type' => 'bank_deposit',
            'source_id' => $deposit->id,
        ]);
    }

    return $deposit;
}

it('shows the deposit detail with its two ledger entries', function () {
    $user = actingAsRole(Role::Bendahara);
    $deposit = makeDeposit($user->id);

    $this->get(route('deposits.show', $deposit))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('deposits/show')
            ->where('deposit.id', $deposit->id)
            ->where('deposit.reference_number', 'REF-1')
            ->has('ledgerEntries', 2));
});

it('forbids roles without deposit permission', function () {
    $user = actingAsRole(Role::Bendahara);
    $deposit = makeDeposit($user->id);

    actingAsRole(Role::Penghitung);
    $this->get(route('deposits.show', $deposit))->assertForbidden();
});

it('redirects guests away from the deposit detail', function () {
    $user = \App\Models\User::factory()->create();
    $deposit = makeDeposit($user->id);

    $this->get(route('deposits.show', $deposit))->assertRedirect(route('login'));
});
