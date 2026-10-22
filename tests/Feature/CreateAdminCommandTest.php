<?php

use App\Models\User;

it('creates the first admin with the admin role and a verified email', function () {
    $this->artisan('app:create-admin', ['--name' => 'Bendahara Utama', '--email' => 'admin@gereja.id', '--password' => 'rahasia-panjang-123'])->assertSuccessful();

    $user = User::where('email', 'admin@gereja.id')->firstOrFail();
    expect($user->hasRole('admin'))->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull()
        ->and($user->is_active)->toBeTrue();
});

it('is idempotent and never overwrites an existing account', function () {
    User::factory()->create(['email' => 'admin@gereja.id', 'name' => 'Nama Lama']);

    $this->artisan('app:create-admin', ['--email' => 'admin@gereja.id', '--password' => 'rahasia-panjang-123'])->assertSuccessful();

    expect(User::where('email', 'admin@gereja.id')->count())->toBe(1)
        ->and(User::where('email', 'admin@gereja.id')->value('name'))->toBe('Nama Lama');
});

it('refuses a weak password or a missing email', function () {
    $this->artisan('app:create-admin', ['--email' => 'admin@gereja.id', '--password' => 'pendek'])->assertFailed();
    $this->artisan('app:create-admin', ['--password' => 'rahasia-panjang-123'])->assertFailed();

    expect(User::where('email', 'admin@gereja.id')->exists())->toBeFalse();
});
