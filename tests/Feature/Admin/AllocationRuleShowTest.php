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

function allocationShowMakeRule(): AllocationRule
{
    $f1 = Fund::create(['code' => 'UMUM', 'name' => 'Umum']);
    $f2 = Fund::create(['code' => 'PEMB', 'name' => 'Pembangunan']);
    $c = Category::create(['name' => 'Persembahan', 'direction' => Direction::In->value, 'default_fund_id' => $f1->id]);
    $r = AllocationRule::create(['category_id' => $c->id, 'name' => 'Aturan 70/30', 'valid_from' => '2026-01-01', 'is_active' => true]);
    $r->items()->create(['fund_id' => $f1->id, 'percentage' => 70, 'sort_order' => 1]);
    $r->items()->create(['fund_id' => $f2->id, 'percentage' => 30, 'sort_order' => 2]);

    return $r;
}

it('shows the allocation rule detail page', function () {
    actingAsRole(Role::Admin);
    $r = allocationShowMakeRule();

    $this->get(route('admin.allocations.show', $r))->assertInertia(fn (Assert $p) => $p
        ->component('admin/allocations/show')
        ->where('rule.name', 'Aturan 70/30')
        ->where('rule.category.name', 'Persembahan')
        ->has('rule.items', 2)
        ->where('rule.items.0.percentage', 70)
        ->where('rule.items.1.fund_name', 'Pembangunan'));
});

it('forbids allocation rule detail without master.manage', function () {
    $r = allocationShowMakeRule();
    actingAsRole(Role::Penghitung);
    $this->get(route('admin.allocations.show', $r))->assertForbidden();
});

it('redirects guests from allocation rule detail', function () {
    $r = allocationShowMakeRule();
    $this->get(route('admin.allocations.show', $r))->assertRedirect(route('login'));
});
