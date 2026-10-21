<?php

use App\Enums\Role;
use App\Models\User;

it('lets admin create a user with roles', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.users.store'), [
        'name' => 'Budi',
        'email' => 'budi@gereja.id',
        'password' => 'rahasia-123',
        'password_confirmation' => 'rahasia-123',
        'roles' => ['bendahara', 'penghitung'],
    ])->assertRedirect(route('admin.users.index'))->assertSessionHasNoErrors();

    $user = User::where('email', 'budi@gereja.id')->firstOrFail();
    expect($user->hasRole('bendahara'))->toBeTrue()
        ->and($user->hasRole('penghitung'))->toBeTrue()
        ->and($user->is_active)->toBeTrue();
});

it('rejects unknown roles', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.users.store'), [
        'name' => 'Budi',
        'email' => 'budi@gereja.id',
        'password' => 'rahasia-123',
        'password_confirmation' => 'rahasia-123',
        'roles' => ['superuser'],
    ])->assertSessionHasErrors('roles.0');
});

it('prevents admin from removing own admin role', function () {
    $admin = actingAsRole(Role::Admin);

    $this->put(route('admin.users.update', $admin), [
        'name' => $admin->name,
        'email' => $admin->email,
        'roles' => ['bendahara'],
    ])->assertSessionHasErrors('roles');

    expect($admin->fresh()->hasRole('admin'))->toBeTrue();
});

it('updates roles of another user', function () {
    actingAsRole(Role::Admin);
    $user = User::factory()->create();
    $user->assignRole('penghitung');

    $this->put(route('admin.users.update', $user), [
        'name' => 'Nama Baru',
        'email' => $user->email,
        'roles' => ['majelis'],
    ])->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->name)->toBe('Nama Baru')
        ->and($user->getRoleNames()->all())->toBe(['majelis']);
});

it('toggles a user inactive and blocks their login', function () {
    actingAsRole(Role::Admin);
    $user = User::factory()->create();

    $this->patch(route('admin.users.toggle', $user))->assertRedirect();
    expect($user->fresh()->is_active)->toBeFalse();

    auth()->logout();
    $this->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('logs out a user who is deactivated mid-session', function () {
    $user = actingAsRole(Role::Bendahara);
    $user->forceFill(['is_active' => false])->save();

    $this->get(route('dashboard'))->assertRedirect(route('login'));
    $this->assertGuest();
});

it('prevents admin from deactivating themselves', function () {
    $admin = actingAsRole(Role::Admin);

    $this->patch(route('admin.users.toggle', $admin))->assertForbidden();
    expect($admin->fresh()->is_active)->toBeTrue();
});

it('renders the user index for admin', function () {
    actingAsRole(Role::Admin);

    $this->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/users/index')->has('users.data', 1));
});

it('gives pemeriksa only the audit permission', function () {
    $user = actingAsRole(Role::Pemeriksa);

    expect($user->can('audit.view'))->toBeTrue()
        ->and($user->can('users.manage'))->toBeFalse();
});
