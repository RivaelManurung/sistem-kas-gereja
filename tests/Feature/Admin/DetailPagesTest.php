<?php

use App\Enums\Role;
use App\Models\AttributeDefinition;
use App\Models\ReportSignatory;
use App\Models\User;

it('shows the user detail page to admin', function () {
    actingAsRole(Role::Admin);
    $user = User::factory()->create(['name' => 'Siti']);
    $user->assignRole('bendahara');

    $this->get(route('admin.users.show', $user))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/show')
            ->where('user.name', 'Siti')
            ->has('roles', 1)
            ->has('groups')
            ->has('logs'));
});

it('forbids the user detail page without users.manage', function () {
    actingAsRole(Role::Bendahara);
    $user = User::factory()->create();

    $this->get(route('admin.users.show', $user))->assertForbidden();
});

it('redirects guests from the user detail page', function () {
    $user = User::factory()->create();

    $this->get(route('admin.users.show', $user))->assertRedirect(route('login'));
});

it('shows the attribute detail page to admin', function () {
    actingAsRole(Role::Admin);
    $def = AttributeDefinition::create([
        'entity_type' => 'member', 'key' => 'hobi', 'label' => 'Hobi', 'data_type' => 'select',
        'options' => ['Musik', 'Olahraga'], 'sort_order' => 1,
    ]);

    $this->get(route('admin.attributes.show', $def))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/attributes/show')
            ->where('definition.key', 'hobi')
            ->where('definition.values_count', 0)
            ->has('definition.options', 2));
});

it('forbids the attribute detail page without master.manage', function () {
    actingAsRole(Role::Bendahara);
    $def = AttributeDefinition::create([
        'entity_type' => 'member', 'key' => 'hobi', 'label' => 'Hobi', 'data_type' => 'text', 'sort_order' => 1,
    ]);

    $this->get(route('admin.attributes.show', $def))->assertForbidden();
});

it('redirects guests from the attribute detail page', function () {
    $def = AttributeDefinition::create([
        'entity_type' => 'member', 'key' => 'hobi', 'label' => 'Hobi', 'data_type' => 'text', 'sort_order' => 1,
    ]);

    $this->get(route('admin.attributes.show', $def))->assertRedirect(route('login'));
});

it('shows the signatory detail page to admin', function () {
    actingAsRole(Role::Admin);
    $sig = ReportSignatory::create(['title' => 'Dibuat oleh', 'position' => 'Bendahara Jemaat', 'role' => 'bendahara', 'order' => 1, 'is_active' => true]);

    $this->get(route('admin.signatures.show', $sig))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/signatures/show')
            ->where('signatory.position', 'Bendahara Jemaat')
            ->where('signatory.role_label', 'Bendahara')
            ->where('signatory.approvals_count', 0));
});

it('forbids the signatory detail page without settings.manage', function () {
    actingAsRole(Role::Bendahara);
    $sig = ReportSignatory::create(['title' => 'Dibuat oleh', 'position' => 'Bendahara', 'order' => 1, 'is_active' => true]);

    $this->get(route('admin.signatures.show', $sig))->assertForbidden();
});

it('redirects guests from the signatory detail page', function () {
    $sig = ReportSignatory::create(['title' => 'Dibuat oleh', 'position' => 'Bendahara', 'order' => 1, 'is_active' => true]);

    $this->get(route('admin.signatures.show', $sig))->assertRedirect(route('login'));
});
