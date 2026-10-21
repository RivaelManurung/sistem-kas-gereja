<?php

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\AttributeDefinition;
use App\Models\Category;
use App\Models\Fund;

it('sends active custom field definitions to category create page', function () {
    actingAsRole(Role::Admin);

    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'penanggung_jawab',
        'label' => 'Penanggung Jawab',
        'data_type' => AttributeType::Text,
        'is_active' => true,
    ]);

    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'field_nonaktif',
        'label' => 'Nonaktif',
        'data_type' => AttributeType::Text,
        'is_active' => false,
    ]);

    $this->get(route('admin.categories.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/categories/form')
            ->has('customFields.definitions', 1)
            ->where('customFields.definitions.0.key', 'penanggung_jawab')
        );
});

it('sends existing custom field values to category edit page', function () {
    actingAsRole(Role::Admin);

    $fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'pj',
        'label' => 'Penanggung Jawab',
        'data_type' => AttributeType::Text,
        'is_active' => true,
    ]);

    $category = Category::create([
        'name' => 'Kategori Edit',
        'direction' => Direction::In,
        'default_fund_id' => $fund->id,
    ]);

    $category->syncCustomAttributes(['pj' => 'John Doe']);

    $this->get(route('admin.categories.edit', $category->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/categories/form')
            ->has('customFields.definitions', 1)
            ->where('customFields.values.pj', 'John Doe')
        );
});
