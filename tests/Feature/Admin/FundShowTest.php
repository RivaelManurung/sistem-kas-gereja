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

it('shows the fund detail page with balances and rules', function () {
    actingAsRole(Role::Admin);
    $a = Account::create(['code' => 'KAS', 'name' => 'Kas', 'type' => AccountType::Cash->value]);
    $f = Fund::create(['code' => 'PEMB', 'name' => 'Pembangunan']);
    $c = Category::create(['name' => 'Persembahan', 'direction' => Direction::In->value, 'default_fund_id' => $f->id]);
    LedgerEntry::create(['entry_date' => now()->toDateString(), 'account_id' => $a->id, 'fund_id' => $f->id, 'category_id' => $c->id, 'amount' => 700000, 'direction' => Direction::In->value, 'description' => 'Masuk']);
    $rule = AllocationRule::create(['category_id' => $c->id, 'name' => 'Aturan A', 'valid_from' => '2026-01-01', 'is_active' => true]);
    $rule->items()->create(['fund_id' => $f->id, 'percentage' => 100, 'sort_order' => 1]);

    $this->get(route('admin.funds.show', $f))->assertInertia(fn (Assert $p) => $p
        ->component('admin/funds/show')
        ->where('fund.code', 'PEMB')
        ->where('balance', 700000)
        ->where('perAccount.0.balance', 700000)
        ->where('rules.0.rule_name', 'Aturan A')
        ->has('entries', 1));
});

it('forbids fund detail without master.manage', function () {
    $f = Fund::create(['code' => 'UMUM', 'name' => 'Umum']);
    actingAsRole(Role::Penghitung);
    $this->get(route('admin.funds.show', $f))->assertForbidden();
});

it('redirects guests from fund detail', function () {
    $f = Fund::create(['code' => 'UMUM', 'name' => 'Umum']);
    $this->get(route('admin.funds.show', $f))->assertRedirect(route('login'));
});
