<?php

use App\Enums\AccountType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\AllocationRule;
use App\Models\Category;
use App\Models\Fund;
use App\Models\LedgerEntry;
use Inertia\Testing\AssertableInertia as Assert;

function accountShowSeedLedger(Account $a, Fund $f, ?Category $c = null): void
{
    LedgerEntry::create(['entry_date' => now()->toDateString(), 'account_id' => $a->id, 'fund_id' => $f->id, 'category_id' => $c?->id, 'amount' => 500000, 'direction' => Direction::In->value, 'description' => 'Setoran']);
    LedgerEntry::create(['entry_date' => now()->toDateString(), 'account_id' => $a->id, 'fund_id' => $f->id, 'category_id' => $c?->id, 'amount' => 120000, 'direction' => Direction::Out->value, 'description' => 'Belanja']);
}

it('shows the account detail page with balances', function () {
    actingAsRole(Role::Admin);
    $a = Account::create(['code' => 'BCA', 'name' => 'BCA Utama', 'type' => AccountType::Bank->value, 'bank_name' => 'BCA', 'account_number' => '123']);
    $f = Fund::create(['code' => 'UMUM', 'name' => 'Kas Umum']);
    accountShowSeedLedger($a, $f);

    $this->get(route('admin.accounts.show', $a))->assertInertia(fn (Assert $p) => $p
        ->component('admin/accounts/show')
        ->where('account.code', 'BCA')
        ->where('account.type_label', 'Bank')
        ->where('balance', 380000)
        ->where('perFund.0.balance', 380000)
        ->has('entries', 2));
});

it('forbids account detail without master.manage', function () {
    $a = Account::create(['code' => 'KAS', 'name' => 'Kas', 'type' => AccountType::Cash->value]);
    actingAsRole(Role::Penghitung);
    $this->get(route('admin.accounts.show', $a))->assertForbidden();
});

it('redirects guests from account detail', function () {
    $a = Account::create(['code' => 'KAS', 'name' => 'Kas', 'type' => AccountType::Cash->value]);
    $this->get(route('admin.accounts.show', $a))->assertRedirect(route('login'));
});
