<?php

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\AttributeDefinition;
use App\Models\Category;
use App\Models\Fund;

it('renders attribute definitions index for admin', function () {
    actingAsRole(Role::Admin);

    $this->get(route('admin.attributes.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/attributes/index')
            ->has('definitions')
        );
});

it('keeps key immutable on update', function () {
    actingAsRole(Role::Admin);

    $def = AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'original_key',
        'label' => 'Original Label',
        'data_type' => AttributeType::Text,
        'is_active' => true,
    ]);

    $this->put(route('admin.attributes.update', $def->id), [
        'key' => 'new_key',
        'label' => 'Updated Label',
        'data_type' => AttributeType::Text->value,
        'is_required' => false,
        'is_public' => true,
        'sort_order' => 1,
    ])->assertRedirect();

    expect($def->fresh()->key)->toBe('original_key')
        ->and($def->fresh()->label)->toBe('Updated Label');
});

it('locks data type when values already exist', function () {
    actingAsRole(Role::Admin);

    $fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    $def = AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'locked_field',
        'label' => 'Locked Field',
        'data_type' => AttributeType::Text,
        'is_active' => true,
    ]);

    $category = Category::create([
        'name' => 'Warta',
        'direction' => Direction::Out,
        'default_fund_id' => $fund->id,
    ]);

    $category->syncCustomAttributes(['locked_field' => 'Ada Isinya']);

    $this->from(route('admin.attributes.edit', $def->id))
        ->put(route('admin.attributes.update', $def->id), [
            'label' => 'Locked Field',
            'data_type' => AttributeType::Number->value,
            'is_required' => false,
            'is_public' => true,
            'sort_order' => 0,
        ])->assertSessionHasErrors(['data_type']);
});

it('requires options for select attribute type', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.attributes.store'), [
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'opsi_pilihan',
        'label' => 'Opsi Pilihan',
        'data_type' => AttributeType::Select->value,
        'options' => [],
        'is_required' => false,
        'is_public' => true,
    ])->assertSessionHasErrors(['options']);
});

it('rejects duplicate key for same entity and scope', function () {
    actingAsRole(Role::Admin);

    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'duplicate_key',
        'label' => 'Duplicate Key',
        'data_type' => AttributeType::Text,
        'scope_event_id' => null,
    ]);

    $this->post(route('admin.attributes.store'), [
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'duplicate_key',
        'label' => 'Duplicate Key Two',
        'data_type' => AttributeType::Text->value,
        'scope_event_id' => null,
        'is_required' => false,
        'is_public' => true,
    ])->assertSessionHasErrors(['key']);
});
