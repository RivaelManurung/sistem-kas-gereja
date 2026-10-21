<?php

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Enums\Role;
use App\Models\AttributeDefinition;
use App\Models\Member;
use App\Models\User;

it('creates member with custom attributes', function () {
    actingAsRole(Role::Admin);

    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Member->value,
        'key' => 'sektor',
        'label' => 'Sektor',
        'data_type' => AttributeType::Select,
        'options' => ['Sektor 1', 'Sektor 2'],
        'is_required' => true,
        'is_active' => true,
    ]);

    // Missing required custom attribute returns validation error
    $this->post(route('admin.members.store'), [
        'name' => 'Jemaat A',
        'gender' => 'L',
    ])->assertSessionHasErrors(['attributes.sektor']);

    // Providing valid custom attribute succeeds
    $this->post(route('admin.members.store'), [
        'name' => 'Jemaat A',
        'gender' => 'L',
        'attributes' => [
            'sektor' => 'Sektor 2',
        ],
    ])->assertRedirect(route('admin.members.index'));

    $member = Member::where('name', 'Jemaat A')->first();
    expect($member)->not->toBeNull()
        ->and($member->customAttributes())->toHaveKey('sektor', 'Sektor 2');
});

it('escapes search wildcards literally', function () {
    actingAsRole(Role::Admin);

    Member::create(['name' => 'Regular Member']);
    Member::create(['name' => 'Special%Member']);

    $response = $this->get(route('admin.members.index', ['search' => '%']));
    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/members/index')
            ->has('members.data', 1)
            ->where('members.data.0.name', 'Special%Member')
        );
});

it('allows user to link to one member only', function () {
    actingAsRole(Role::Admin);

    $user = User::factory()->create();

    Member::create([
        'name' => 'Member Satu',
        'user_id' => $user->id,
    ]);

    $this->post(route('admin.members.store'), [
        'name' => 'Member Dua',
        'user_id' => $user->id,
    ])->assertSessionHasErrors(['user_id']);
});

it('restricts member access based on role', function () {
    actingAsRole(Role::Penghitung);
    $this->get(route('admin.members.index'))->assertForbidden();

    actingAsRole(Role::Bendahara);
    $this->get(route('admin.members.index'))->assertOk();
});
