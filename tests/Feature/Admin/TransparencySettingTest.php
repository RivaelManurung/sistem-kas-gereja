<?php

use App\Enums\Role;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Fund;

beforeEach(function () {
    $fund = Fund::create(['code' => 'UMUM-T', 'name' => 'Dana Umum', 'is_active' => true]);
    $this->shown = Category::create(['name' => 'Persembahan Umum', 'direction' => 'in', 'default_fund_id' => $fund->id, 'is_public' => true]);
    $this->hidden = Category::create(['name' => 'Biaya Rahasia', 'direction' => 'out', 'default_fund_id' => $fund->id, 'is_public' => false]);
});

it('lets an admin enable the public page and choose which categories are public', function () {
    actingAsRole(Role::Admin);

    $this->put(route('admin.transparency.update'), [
        'enabled' => true,
        'public_category_ids' => [$this->hidden->id],
    ])->assertSessionHasNoErrors()->assertRedirect();

    expect(ChurchSetting::current()->public_page_enabled)->toBeTrue()
        ->and($this->shown->fresh()->is_public)->toBeFalse()
        ->and($this->hidden->fresh()->is_public)->toBeTrue();
});

it('keeps the public page setting when the church settings form is saved', function () {
    actingAsRole(Role::Admin);
    ChurchSetting::current()->update(['public_page_enabled' => true]);

    $this->put(route('admin.settings.update'), [
        'name' => 'Gereja',
        'timezone' => 'Asia/Jakarta',
        'denominations' => [100000],
        'min_confirmations_service' => 2,
        'min_confirmations_event' => 2,
        'min_confirmations_general' => 2,
        'expense_approval_threshold' => 0,
    ])->assertSessionHasNoErrors();

    expect(ChurchSetting::current()->fresh()->public_page_enabled)->toBeTrue();
});

it('forbids users without the settings permission', function () {
    actingAsRole(Role::Bendahara);

    $this->get(route('admin.transparency.edit'))->assertForbidden();
    $this->put(route('admin.transparency.update'), ['enabled' => true, 'public_category_ids' => []])->assertForbidden();
});
