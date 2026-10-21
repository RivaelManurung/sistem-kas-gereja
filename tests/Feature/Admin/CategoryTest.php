<?php

use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Fund;
use Database\Seeders\MasterDataSeeder;

it('seeds default categories linked to funds', function () {
    $this->seed(MasterDataSeeder::class);

    $kolekte = Category::where('name', 'Kolekte')->where('direction', Direction::In)->first();
    expect($kolekte)->not->toBeNull()
        ->and($kolekte->defaultFund->code)->toBe('UMUM')
        ->and($kolekte->allows_named)->toBeFalse();

    $perpuluhan = Category::where('name', 'Perpuluhan')->where('direction', Direction::In)->first();
    expect($perpuluhan)->not->toBeNull()
        ->and($perpuluhan->allows_named)->toBeTrue();

    $diakoniaOut = Category::where('name', 'Diakonia')->where('direction', Direction::Out)->first();
    expect($diakoniaOut)->not->toBeNull()
        ->and($diakoniaOut->defaultFund->code)->toBe('DIAK');
});

it('rejects inactive default fund', function () {
    actingAsRole(Role::Admin);

    $fund = Fund::create([
        'code' => 'INACT',
        'name' => 'Inactive Fund',
        'is_active' => false,
    ]);

    $this->post(route('admin.categories.store'), [
        'name' => 'Kategori Baru',
        'direction' => Direction::In->value,
        'default_fund_id' => $fund->id,
    ])->assertSessionHasErrors(['default_fund_id']);
});

it('allows same name across directions but rejects duplicate in same direction', function () {
    actingAsRole(Role::Admin);

    $fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    $this->post(route('admin.categories.store'), [
        'name' => 'Diakonia',
        'direction' => Direction::In->value,
        'default_fund_id' => $fund->id,
    ])->assertRedirect(route('admin.categories.index', ['direction' => 'in']));

    $this->post(route('admin.categories.store'), [
        'name' => 'Diakonia',
        'direction' => Direction::Out->value,
        'default_fund_id' => $fund->id,
    ])->assertRedirect(route('admin.categories.index', ['direction' => 'out']));

    $this->post(route('admin.categories.store'), [
        'name' => 'Diakonia',
        'direction' => Direction::In->value,
        'default_fund_id' => $fund->id,
    ])->assertSessionHasErrors(['name']);
});

it('rejects allows_named for out direction', function () {
    actingAsRole(Role::Admin);

    $fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    $this->post(route('admin.categories.store'), [
        'name' => 'Pengeluaran Bernama',
        'direction' => Direction::Out->value,
        'default_fund_id' => $fund->id,
        'allows_named' => true,
    ])->assertSessionHasErrors(['allows_named']);
});
