<?php

use App\Enums\AccountType;
use App\Enums\Role;
use App\Models\Account;
use App\Models\AuditLog;
use App\Models\Fund;
use Database\Seeders\MasterDataSeeder;

it('seeds default accounts and funds', function () {
    $this->seed(MasterDataSeeder::class);

    expect(Account::count())->toBe(2)
        ->and(Fund::count())->toBe(3)
        ->and(Account::where('code', 'KAS')->exists())->toBeTrue()
        ->and(Account::where('code', 'KK')->exists())->toBeTrue()
        ->and(Fund::where('code', 'UMUM')->exists())->toBeTrue()
        ->and(Fund::where('code', 'PEMB')->exists())->toBeTrue()
        ->and(Fund::where('code', 'DIAK')->exists())->toBeTrue();
});

it('requires bank details when account type is bank', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.accounts.store'), [
        'code' => 'BCA',
        'name' => 'BCA Operasional',
        'type' => AccountType::Bank->value,
    ])->assertSessionHasErrors(['bank_name', 'account_number']);

    $this->post(route('admin.accounts.store'), [
        'code' => 'bca',
        'name' => 'BCA Operasional',
        'type' => AccountType::Bank->value,
        'bank_name' => 'BCA',
        'account_number' => '1234567890',
    ])->assertRedirect(route('admin.accounts.index'));

    $account = Account::where('code', 'BCA')->first();
    expect($account)->not->toBeNull()
        ->and($account->code)->toBe('BCA')
        ->and($account->bank_name)->toBe('BCA');
});

it('enforces uppercase unique code for accounts and funds', function () {
    actingAsRole(Role::Admin);

    Account::create([
        'code' => 'KAS',
        'name' => 'Kas Tunai',
        'type' => AccountType::Cash,
    ]);

    $this->post(route('admin.accounts.store'), [
        'code' => 'kas',
        'name' => 'Kas Lain',
        'type' => AccountType::Cash->value,
    ])->assertSessionHasErrors(['code']);

    Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
    ]);

    $this->post(route('admin.funds.store'), [
        'code' => 'umum',
        'name' => 'Kas Umum Lain',
    ])->assertSessionHasErrors(['code']);
});

it('does not have destroy route for accounts and funds', function () {
    actingAsRole(Role::Admin);

    $account = Account::create([
        'code' => 'ACC',
        'name' => 'Account',
        'type' => AccountType::Cash,
    ]);

    $fund = Fund::create([
        'code' => 'FND',
        'name' => 'Fund',
    ]);

    $this->delete("/admin/accounts/{$account->id}")->assertStatus(405);
    $this->delete("/admin/funds/{$fund->id}")->assertStatus(405);
});

it('toggles account and fund active status and audits the change', function () {
    actingAsRole(Role::Admin);

    $account = Account::create([
        'code' => 'ACC2',
        'name' => 'Account 2',
        'type' => AccountType::Cash,
        'is_active' => true,
    ]);

    $this->patch(route('admin.accounts.toggle', $account->id))->assertRedirect();
    expect($account->fresh()->is_active)->toBeFalse();

    $log = AuditLog::where('auditable_type', 'account')
        ->where('auditable_id', $account->id)
        ->latest('id')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->event)->toBe('updated')
        ->and($log->new_values)->toHaveKey('is_active', false);

    $fund = Fund::create([
        'code' => 'FND2',
        'name' => 'Fund 2',
        'is_active' => true,
    ]);

    $this->patch(route('admin.funds.toggle', $fund->id))->assertRedirect();
    expect($fund->fresh()->is_active)->toBeFalse();
});
