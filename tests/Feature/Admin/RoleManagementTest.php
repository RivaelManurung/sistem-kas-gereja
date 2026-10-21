<?php

use App\Enums\Permission;
use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\User;
use Spatie\Permission\Models\Role as RoleModel;

function userWithPermissions(array $permissions): User
{
    $role = RoleModel::create(['name' => 'uji-'.uniqid(), 'guard_name' => 'web', 'label' => 'Peran Uji '.uniqid()]);
    $role->syncPermissions($permissions);
    $user = User::factory()->create();
    $user->assignRole($role);
    test()->actingAs($user);

    return $user;
}

it('shows the role list only to users who can manage roles', function () {
    actingAsRole(Role::Admin);
    $this->get(route('admin.roles.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/roles/index')->has('roles', 7));
});

it('denies the role pages to users without the roles.manage permission', function () {
    actingAsRole(Role::Bendahara);

    $this->get(route('admin.roles.index'))->assertForbidden();
    $this->get(route('admin.roles.create'))->assertForbidden();
    $this->post(route('admin.roles.store'), ['label' => 'Peretas', 'permissions' => ['roles.manage']])->assertForbidden();
});

it('redirects guests to login', function () {
    $this->get(route('admin.roles.index'))->assertRedirect(route('login'));
});

it('creates a custom role with a slug name and records it in the audit trail', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.roles.store'), [
        'label' => 'Bendahara Komisi',
        'description' => 'Mengelola kas komisi',
        'permissions' => [Permission::ExpensesView->value, Permission::ExpensesApprove->value],
    ])->assertSessionHasNoErrors();

    $role = RoleModel::where('label', 'Bendahara Komisi')->firstOrFail();
    expect($role->name)->toBe('bendahara-komisi')
        ->and($role->permissions->pluck('name')->sort()->values()->all())->toBe(['expenses.approve', 'expenses.view']);

    $log = AuditLog::where('auditable_type', 'role')->where('event', 'created')->firstOrFail();
    expect($log->new_values['permissions'])->toContain('Setujui atau tolak pengeluaran');
});

it('rejects an unknown permission and a duplicate role name', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.roles.store'), ['label' => 'Aneh', 'permissions' => ['segalanya.boleh']])
        ->assertSessionHasErrors('permissions.0');

    $this->post(route('admin.roles.store'), ['label' => 'Koordinator', 'permissions' => []])->assertSessionHasNoErrors();
    $this->post(route('admin.roles.store'), ['label' => 'Koordinator', 'permissions' => []])->assertSessionHasErrors('label');
});

it('does not let someone grant a permission they do not hold', function () {
    userWithPermissions([Permission::RolesManage->value, Permission::ExpensesView->value]);

    $this->post(route('admin.roles.store'), [
        'label' => 'Naik Pangkat',
        'permissions' => [Permission::ExpensesView->value, Permission::ExpensesPay->value],
    ])->assertSessionHasErrors('permissions');

    expect(RoleModel::where('label', 'Naik Pangkat')->exists())->toBeFalse();
});

it('keeps the admin role locked and built-in roles undeletable', function () {
    actingAsRole(Role::Admin);
    $admin = RoleModel::findByName('admin');
    $bendahara = RoleModel::findByName('bendahara');

    $this->put(route('admin.roles.update', $admin), ['label' => 'Admin', 'permissions' => []])->assertForbidden();
    $this->delete(route('admin.roles.destroy', $bendahara))->assertForbidden();

    expect($admin->fresh()->permissions)->toHaveCount(count(Permission::cases()));
});

it('lets admin change a built-in role and logs the before and after', function () {
    actingAsRole(Role::Admin);
    $role = RoleModel::findByName('penghitung');

    $this->put(route('admin.roles.update', $role), [
        'label' => 'Penghitung',
        'description' => null,
        'permissions' => [Permission::CountingManage->value, Permission::ExpensesView->value],
    ])->assertSessionHasNoErrors();

    expect($role->fresh()->hasPermissionTo(Permission::ExpensesView->value))->toBeTrue();
    $log = AuditLog::where('auditable_type', 'role')->where('event', 'updated')->firstOrFail();
    expect($log->old_values['permissions'])->not->toContain('Lihat dan ajukan pengeluaran')
        ->and($log->new_values['permissions'])->toContain('Lihat dan ajukan pengeluaran');
});

it('refuses to delete a role that still has users and deletes an empty custom role', function () {
    actingAsRole(Role::Admin);

    $used = RoleModel::create(['name' => 'dipakai', 'guard_name' => 'web', 'label' => 'Dipakai']);
    User::factory()->create()->assignRole($used);
    $this->delete(route('admin.roles.destroy', $used))->assertSessionHas('error');
    expect(RoleModel::where('name', 'dipakai')->exists())->toBeTrue();

    $empty = RoleModel::create(['name' => 'kosong', 'guard_name' => 'web', 'label' => 'Kosong']);
    $this->delete(route('admin.roles.destroy', $empty))->assertRedirect(route('admin.roles.index'));
    expect(RoleModel::where('name', 'kosong')->exists())->toBeFalse();
});

it('gives a custom role real access through its permissions, and nothing else', function () {
    userWithPermissions([Permission::CountingManage->value]);

    $this->get(route('sessions.index'))->assertOk();
    $this->get(route('deposits.index'))->assertForbidden();
    $this->get(route('expenses.index'))->assertForbidden();
    $this->get(route('admin.users.index'))->assertForbidden();
});

it('lets a role with only expense permissions see expenses but not approve', function () {
    $user = userWithPermissions([Permission::ExpensesView->value]);

    $this->get(route('expenses.index'))->assertOk();
    expect($user->can(Permission::ExpensesApprove->value))->toBeFalse();
});

it('does not let a user manager assign a role holding permissions they lack', function () {
    userWithPermissions([Permission::UsersManage->value]);
    $target = User::factory()->create();

    $this->put(route('admin.users.update', $target), [
        'name' => $target->name,
        'email' => $target->email,
        'roles' => ['bendahara'],
    ])->assertSessionHasErrors('roles');

    expect($target->fresh()->hasRole('bendahara'))->toBeFalse();
});

it('shows a custom role in the user form options with its label', function () {
    actingAsRole(Role::Admin);
    RoleModel::create(['name' => 'pemuda', 'guard_name' => 'web', 'label' => 'Ketua Pemuda']);

    $this->get(route('admin.users.create'))->assertInertia(fn ($page) => $page
        ->where('roleOptions', fn ($opts) => collect($opts)->contains(fn ($o) => $o['value'] === 'pemuda' && $o['label'] === 'Ketua Pemuda')));
});
