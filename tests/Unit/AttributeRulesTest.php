<?php

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Models\AttributeDefinition;
use App\Support\Attributes\AttributeRules;

it('builds required number rule for active definition', function () {
    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Member->value,
        'key' => 'jumlah_peserta',
        'label' => 'Jumlah Peserta',
        'data_type' => AttributeType::Number,
        'is_required' => true,
        'is_active' => true,
    ]);

    $rules = AttributeRules::for(AttributeEntity::Member);

    expect($rules)->toHaveKey('attributes.jumlah_peserta')
        ->and($rules['attributes.jumlah_peserta'])->toContain('required')
        ->and($rules['attributes.jumlah_peserta'])->toContain('numeric');
});

it('excludes inactive definitions from validation rules', function () {
    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Member->value,
        'key' => 'inactive_field',
        'label' => 'Inactive Field',
        'data_type' => AttributeType::Text,
        'is_active' => false,
    ]);

    $rules = AttributeRules::for(AttributeEntity::Member);
    expect($rules)->not->toHaveKey('attributes.inactive_field');
});

it('includes event scoped definitions only when scope matches', function () {
    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Event->value,
        'key' => 'ukuran_kaos',
        'label' => 'Ukuran Kaos',
        'data_type' => AttributeType::Text,
        'scope_event_id' => 7,
        'is_active' => true,
    ]);

    $rules7 = AttributeRules::for(AttributeEntity::Event, 7);
    $rules8 = AttributeRules::for(AttributeEntity::Event, 8);
    $rulesGlobal = AttributeRules::for(AttributeEntity::Event);

    expect($rules7)->toHaveKey('attributes.ukuran_kaos')
        ->and($rules8)->not->toHaveKey('attributes.ukuran_kaos')
        ->and($rulesGlobal)->not->toHaveKey('attributes.ukuran_kaos');
});
