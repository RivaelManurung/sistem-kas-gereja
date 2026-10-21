<?php

use App\Enums\Role;
use App\Models\ChurchSetting;
use App\Models\LookupOption;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function tinyPng(string $name): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='));
}

it('lets an admin add and rename a dropdown option', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.options.store'), ['group' => 'payment_method', 'label' => 'Kartu Debit', 'sort_order' => 4])
        ->assertSessionHasNoErrors();

    $option = LookupOption::where('group', 'payment_method')->where('label', 'Kartu Debit')->firstOrFail();
    expect($option->value)->toBe('kartu_debit');

    $this->put(route('admin.options.update', $option), ['label' => 'Debit', 'sort_order' => 5])->assertSessionHasNoErrors();
    expect($option->fresh()->label)->toBe('Debit');
});

it('rejects a duplicate option name and an unknown group', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.options.store'), ['group' => 'payment_method', 'label' => 'tunai (amplop)'])->assertSessionHasErrors('label');
    $this->post(route('admin.options.store'), ['group' => 'nope', 'label' => 'Apa saja'])->assertSessionHasErrors('group');
});

it('keeps at least one active option so a dropdown is never empty', function () {
    actingAsRole(Role::Admin);
    $options = LookupOption::where('group', 'payment_method')->get();

    $options->skip(1)->each(fn ($o) => $this->patch(route('admin.options.toggle', $o)));
    $this->patch(route('admin.options.toggle', $options->first()))->assertSessionHas('error');

    expect(LookupOption::where('group', 'payment_method')->where('is_active', true)->count())->toBe(1);
});

it('denies dropdown settings to users without master data permission', function () {
    actingAsRole(Role::Penghitung);

    $this->get(route('admin.options.index'))->assertForbidden();
    $this->post(route('admin.options.store'), ['group' => 'payment_method', 'label' => 'Gelap'])->assertForbidden();
});

it('stores a custom system name and logo, and reuses the logo as favicon', function () {
    Storage::fake('public');
    actingAsRole(Role::Admin);
    $settings = ChurchSetting::current();

    $this->post(route('admin.settings.update'), [
        '_method' => 'PUT',
        'name' => 'GKI Contoh',
        'system_name' => 'Kas GKI',
        'timezone' => 'Asia/Jakarta',
        'denominations' => [100000, 50000],
        'min_confirmations_service' => 2,
        'min_confirmations_event' => 2,
        'min_confirmations_general' => 2,
        'expense_approval_threshold' => 1000000,
        'logo' => tinyPng('logo.png'),
    ])->assertSessionHasNoErrors();

    $settings->refresh();
    expect($settings->system_name)->toBe('Kas GKI');
    Storage::disk('public')->assertExists($settings->logo_path);

    $this->get(route('dashboard'))->assertInertia(fn ($page) => $page
        ->where('brand.name', 'Kas GKI')
        ->whereNot('brand.logo_url', null)
        ->where('brand.favicon_url', fn ($url) => $url === $settings->brand()['logo_url']));
});

it('removes the logo when asked and rejects non-image uploads', function () {
    Storage::fake('public');
    actingAsRole(Role::Admin);
    $settings = ChurchSetting::current();
    $settings->update(['logo_path' => tinyPng('l.png')->store('church', 'public')]);

    $base = [
        '_method' => 'PUT', 'name' => 'GKI', 'timezone' => 'Asia/Jakarta', 'denominations' => [1000],
        'min_confirmations_service' => 2, 'min_confirmations_event' => 2, 'min_confirmations_general' => 2, 'expense_approval_threshold' => 0,
    ];

    $this->post(route('admin.settings.update'), [...$base, 'logo' => UploadedFile::fake()->create('x.exe', 10)])->assertSessionHasErrors('logo');
    $this->post(route('admin.settings.update'), [...$base, 'remove_logo' => true])->assertSessionHasNoErrors();

    expect($settings->fresh()->logo_path)->toBeNull();
});

it('formats money fields as integers within a sane upper bound', function () {
    actingAsRole(Role::Bendahara);

    $this->post(route('transfers.store'), ['from_fund_id' => 1, 'to_fund_id' => 2, 'account_id' => 1, 'amount' => 1000000000000000, 'transfer_date' => '2026-10-21', 'reason' => 'Uji batas nominal'])
        ->assertSessionHasErrors('amount');
    $this->post(route('transfers.store'), ['from_fund_id' => 1, 'to_fund_id' => 2, 'account_id' => 1, 'amount' => 1500.5, 'transfer_date' => '2026-10-21', 'reason' => 'Uji pecahan'])
        ->assertSessionHasErrors('amount');
});
