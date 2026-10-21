<?php

use App\Enums\FundTransferStatus;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Fund;
use App\Models\FundTransfer;
use App\Models\User;

function makeTransfer(int $requesterId): FundTransfer
{
    $a = Fund::create(['code' => 'UMUM', 'name' => 'Dana Umum']);
    $b = Fund::create(['code' => 'DIAK', 'name' => 'Diakonia']);
    $acc = Account::create(['code' => 'KAS', 'name' => 'Kas Tunai', 'type' => 'cash']);

    return FundTransfer::create([
        'from_fund_id' => $a->id,
        'to_fund_id' => $b->id,
        'account_id' => $acc->id,
        'amount' => 250000,
        'transfer_date' => '2026-10-20',
        'reason' => 'Menutup kekurangan',
        'status' => FundTransferStatus::Pending,
        'requested_by' => $requesterId,
    ]);
}

it('shows the transfer detail with approval flag for another approver', function () {
    $requester = User::factory()->create();
    $transfer = makeTransfer($requester->id);
    actingAsRole(Role::Bendahara);

    $this->get(route('transfers.show', $transfer))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('transfers/show')
            ->where('transfer.id', $transfer->id)
            ->where('transfer.reason', 'Menutup kekurangan')
            ->where('canApprove', true)
            ->has('ledgerEntries', 0));
});

it('does not let the requester approve their own transfer', function () {
    $user = actingAsRole(Role::Bendahara);
    $transfer = makeTransfer($user->id);

    $this->get(route('transfers.show', $transfer))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('canApprove', false));
});

it('forbids roles without transfer permission', function () {
    $transfer = makeTransfer(User::factory()->create()->id);
    actingAsRole(Role::Penghitung);

    $this->get(route('transfers.show', $transfer))->assertForbidden();
});

it('redirects guests away from the transfer detail', function () {
    $transfer = makeTransfer(User::factory()->create()->id);

    $this->get(route('transfers.show', $transfer))->assertRedirect(route('login'));
});
