<?php

use App\Enums\Role;

dataset('admin_routes', [
    'admin.users.index',
]);

it('forbids non-admin roles from admin routes', function (Role $role, string $routeName) {
    actingAsRole($role);

    $this->get(route($routeName))->assertForbidden();
})->with([Role::Penghitung, Role::Jemaat, Role::Bendahara])->with('admin_routes');

it('allows admin on admin routes', function (string $routeName) {
    actingAsRole(Role::Admin);

    $this->get(route($routeName))->assertOk();
})->with('admin_routes');

it('redirects guests from admin routes to login', function (string $routeName) {
    $this->get(route($routeName))->assertRedirect(route('login'));
})->with('admin_routes');
