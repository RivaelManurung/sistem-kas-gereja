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

it('shows the category detail page with totals', function () {
    actingAsRole(Role::Admin);
    $a = Account::create(['code' => 'KAS', 'name' => 'Kas', 'type' => AccountType::Cash->value]);
    $f = Fund::create(['code' => 'UMUM', 'name' => 'Umum']);
    $c = Category::create(['name' => 'Persepuluhan', 'direction' => Direction::In->value, 'default_fund_id' => $f->id]);
    LedgerEntry::create(['entry_date' => now()->toDateString(), 'account_id' => $a->id, 'fund_id' => $f->id, 'category_id' => $c->id, 'amount' => 250000, 'direction' => Direction::In->value, 'description' => 'Masuk']);
    LedgerEntry::create(['entry_date' => now()->subYears(2)->toDateString(), 'account_id' => $a->id, 'fund_id' => $f->id, 'category_id' => $c->id, 'amount' => 100000, 'direction' => Direction::In->value, 'description' => 'Lama']);

    $this->get(route('admin.categories.show', $c))->assertInertia(fn (Assert $p) => $p
        ->component('admin/categories/show')
        ->where('category.name', 'Persepuluhan')
        ->where('category.direction_label', 'Pemasukan')
        ->where('totals.year', 250000)
        ->where('totals.all_time', 350000)
        ->has('entries', 2)
        ->has('customFields.definitions'));
});

it('forbids category detail without master.manage', function () {
    $f = Fund::create(['code' => 'UMUM', 'name' => 'Umum']);
    $c = Category::create(['name' => 'X', 'direction' => Direction::In->value, 'default_fund_id' => $f->id]);
    actingAsRole(Role::Penghitung);
    $this->get(route('admin.categories.show', $c))->assertForbidden();
});

it('redirects guests from category detail', function () {
    $f = Fund::create(['code' => 'UMUM', 'name' => 'Umum']);
    $c = Category::create(['name' => 'X', 'direction' => Direction::In->value, 'default_fund_id' => $f->id]);
    $this->get(route('admin.categories.show', $c))->assertRedirect(route('login'));
});
