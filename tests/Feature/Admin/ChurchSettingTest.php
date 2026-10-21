<?php

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\ChurchSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('creates default settings on first call to current', function () {
    expect(ChurchSetting::count())->toBe(0);

    $settings = ChurchSetting::current();

    expect($settings)->toBeInstanceOf(ChurchSetting::class)
        ->and($settings->name)->toBe('Gereja')
        ->and($settings->denominations)->toBe([100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100])
        ->and(ChurchSetting::count())->toBe(1);

    $again = ChurchSetting::current();
    expect($again->id)->toBe($settings->id)
        ->and(ChurchSetting::count())->toBe(1);
});

it('renders settings edit page for admin', function () {
    actingAsRole(Role::Admin);

    $this->get(route('admin.settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings/edit')
            ->has('settings')
        );
});

it('stores denominations sorted descending', function () {
    actingAsRole(Role::Admin);

    $this->put(route('admin.settings.update'), [
        'name' => 'HKBP Sudirman',
        'address' => 'Jl. Sudirman No. 1',
        'city' => 'Jakarta',
        'phone' => '021-123456',
        'email' => 'gereja@example.com',
        'timezone' => 'Asia/Jakarta',
        'denominations' => [500, 100000, 1000, 50000],
        'min_confirmations_service' => 2,
        'min_confirmations_event' => 2,
        'min_confirmations_general' => 2,
        'expense_approval_threshold' => 10000000,
        'allow_negative_balance' => false,
        'public_page_enabled' => true,
    ])->assertSessionHasNoErrors()->assertRedirect();

    $settings = ChurchSetting::current();
    expect($settings->denominations)->toBe([100000, 50000, 1000, 500]);
});

it('rejects invalid denominations', function (array $denominations) {
    actingAsRole(Role::Admin);

    $this->from(route('admin.settings.edit'))
        ->put(route('admin.settings.update'), [
            'name' => 'Gereja',
            'timezone' => 'Asia/Jakarta',
            'denominations' => $denominations,
            'min_confirmations_service' => 2,
            'min_confirmations_event' => 2,
            'min_confirmations_general' => 2,
            'expense_approval_threshold' => 0,
            'allow_negative_balance' => false,
            'public_page_enabled' => false,
        ])
        ->assertSessionHasErrors('denominations*');
})->with([
    'zero' => fn () => [0],
    'negative' => fn () => [-500],
    'duplicate' => fn () => [1000, 1000],
    'decimal' => fn () => [1500.5],
    'empty' => fn () => [],
]);

it('rejects min confirmations below one', function () {
    actingAsRole(Role::Admin);

    $this->from(route('admin.settings.edit'))
        ->put(route('admin.settings.update'), [
            'name' => 'Gereja',
            'timezone' => 'Asia/Jakarta',
            'denominations' => [100000],
            'min_confirmations_service' => 0,
            'min_confirmations_event' => 2,
            'min_confirmations_general' => 2,
            'expense_approval_threshold' => 0,
            'allow_negative_balance' => false,
            'public_page_enabled' => false,
        ])
        ->assertSessionHasErrors(['min_confirmations_service']);
});

it('audits settings update', function () {
    actingAsRole(Role::Admin);
    ChurchSetting::current();

    $this->put(route('admin.settings.update'), [
        'name' => 'Gereja Baru',
        'timezone' => 'Asia/Jakarta',
        'denominations' => [100000, 50000],
        'min_confirmations_service' => 3,
        'min_confirmations_event' => 2,
        'min_confirmations_general' => 2,
        'expense_approval_threshold' => 5000000,
        'allow_negative_balance' => false,
        'public_page_enabled' => false,
    ])->assertRedirect();

    $log = AuditLog::query()
        ->where('auditable_type', 'church_setting')
        ->latest('id')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->new_values)->toHaveKey('name', 'Gereja Baru')
        ->and($log->new_values)->toHaveKey('min_confirmations_service', 3);
});
