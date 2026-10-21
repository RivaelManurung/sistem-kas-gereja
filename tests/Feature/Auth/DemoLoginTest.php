<?php

use App\Enums\Role;
use App\Models\User;

function demoUser(string $email, Role $role, bool $active = true): User
{
    $user = User::factory()->create(['email' => $email, 'is_active' => $active]);
    $user->assignRole($role->value);

    return $user;
}

it('logs in as a listed demo account with one click when demo login is on', function () {
    config(['app.demo_login' => true]);
    demoUser('bendahara@gereja.test', Role::Bendahara);

    $this->post(route('demo.login'), ['email' => 'bendahara@gereja.test'])->assertRedirect(route('dashboard'));

    $this->assertAuthenticated();
    expect(auth()->user()->email)->toBe('bendahara@gereja.test');
});

it('lists the demo accounts on the login page only when demo login is on', function () {
    demoUser('admin@gereja.test', Role::Admin);

    config(['app.demo_login' => true]);
    $this->get(route('login'))->assertInertia(fn ($page) => $page->has('demoAccounts', 1));

    config(['app.demo_login' => false]);
    $this->get(route('login'))->assertInertia(fn ($page) => $page->has('demoAccounts', 0));
});

it('is a 404 when demo login is off', function () {
    config(['app.demo_login' => false]);
    demoUser('admin@gereja.test', Role::Admin);

    $this->post(route('demo.login'), ['email' => 'admin@gereja.test'])->assertNotFound();
    $this->assertGuest();
});

it('never logs in an account that is not on the demo list, and skips deactivated ones', function () {
    config(['app.demo_login' => true]);
    User::factory()->create(['email' => 'bendahara.asli@gereja.org'])->assignRole(Role::Admin->value);
    demoUser('majelis@gereja.test', Role::Majelis, active: false);

    $this->post(route('demo.login'), ['email' => 'bendahara.asli@gereja.org'])->assertNotFound();
    $this->post(route('demo.login'), ['email' => 'majelis@gereja.test'])->assertNotFound();
    $this->assertGuest();
});
