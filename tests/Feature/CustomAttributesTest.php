<?php

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\AttributeDefinition;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Fund;

beforeEach(function () {
    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);
});

it('stores number in typed column and formats decimals', function () {
    $def = AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'anggaran_tahunan',
        'label' => 'Anggaran Tahunan',
        'data_type' => AttributeType::Number,
        'is_active' => true,
    ]);

    $category = Category::create([
        'name' => 'Musik',
        'direction' => Direction::Out,
        'default_fund_id' => $this->fund->id,
    ]);

    $category->syncCustomAttributes(['anggaran_tahunan' => '1500.50']);

    $val = $category->customAttributeValues()->first();
    expect($val)->not->toBeNull()
        ->and((float) $val->value_number)->toBe(1500.5)
        ->and($val->value_text)->toBeNull()
        ->and($val->value_date)->toBeNull()
        ->and($val->value_bool)->toBeNull();

    expect($category->customAttributes())->toHaveKey('anggaran_tahunan', '1500.5000');
});

it('rejects non numeric and indonesian thousands format in validation', function (string $invalidValue) {
    actingAsRole(Role::Admin);

    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'target_nominal',
        'label' => 'Target Nominal',
        'data_type' => AttributeType::Number,
        'is_active' => true,
    ]);

    $this->post(route('admin.categories.store'), [
        'name' => 'Target Category',
        'direction' => Direction::In->value,
        'default_fund_id' => $this->fund->id,
        'attributes' => [
            'target_nominal' => $invalidValue,
        ],
    ])->assertSessionHasErrors(['attributes.target_nominal']);
})->with([
    'abc' => 'abc',
    'indonesian thousand dot' => '1.000',
    'comma decimal' => '1,5',
]);

it('rejects select value outside defined options', function () {
    actingAsRole(Role::Admin);

    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'penanggung_jawab',
        'label' => 'Penanggung Jawab',
        'data_type' => AttributeType::Select,
        'options' => ['Seksi Musik', 'Seksi Diakonia'],
        'is_active' => true,
    ]);

    $this->post(route('admin.categories.store'), [
        'name' => 'Kolekte Khusus',
        'direction' => Direction::In->value,
        'default_fund_id' => $this->fund->id,
        'attributes' => [
            'penanggung_jawab' => 'Seksi Tidak Ada',
        ],
    ])->assertSessionHasErrors(['attributes.penanggung_jawab']);
});

it('ignores undefined and foreign entity keys', function () {
    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Member->value,
        'key' => 'golongan_darah',
        'label' => 'Golongan Darah',
        'data_type' => AttributeType::Text,
        'is_active' => true,
    ]);

    $category = Category::create([
        'name' => 'Konsumsi',
        'direction' => Direction::Out,
        'default_fund_id' => $this->fund->id,
    ]);

    $category->syncCustomAttributes([
        'tidak_ada' => 'nilai sembarang',
        'golongan_darah' => 'O',
    ]);

    expect($category->customAttributeValues()->count())->toBe(0);
});

it('keeps old values when definition is deactivated', function () {
    $def = AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'catatan_khusus',
        'label' => 'Catatan Khusus',
        'data_type' => AttributeType::Text,
        'is_active' => true,
    ]);

    $category = Category::create([
        'name' => 'Renovasi',
        'direction' => Direction::Out,
        'default_fund_id' => $this->fund->id,
    ]);

    $category->syncCustomAttributes(['catatan_khusus' => 'Prioritas Tinggi']);
    expect($category->customAttributes())->toHaveKey('catatan_khusus', 'Prioritas Tinggi');

    $def->update(['is_active' => false]);

    // Value remains in customAttributes()
    expect($category->fresh()->customAttributes())->toHaveKey('catatan_khusus', 'Prioritas Tinggi');

    // But validation rules for category do not include it anymore
    $rules = \App\Support\Attributes\AttributeRules::for(AttributeEntity::Category);
    expect($rules)->not->toHaveKey('attributes.catatan_khusus');
});

it('deletes value row when empty value is given', function () {
    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'deskripsi_pendek',
        'label' => 'Deskripsi Pendek',
        'data_type' => AttributeType::Text,
        'is_active' => true,
    ]);

    $category = Category::create([
        'name' => 'Doa',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
    ]);

    $category->syncCustomAttributes(['deskripsi_pendek' => 'Info']);
    expect($category->customAttributeValues()->count())->toBe(1);

    $category->syncCustomAttributes(['deskripsi_pendek' => '']);
    expect($category->customAttributeValues()->count())->toBe(0);
});

it('audits attribute syncing', function () {
    actingAsRole(Role::Admin);

    AttributeDefinition::create([
        'entity_type' => AttributeEntity::Category->value,
        'key' => 'pj',
        'label' => 'PJ',
        'data_type' => AttributeType::Text,
        'is_active' => true,
    ]);

    $category = Category::create([
        'name' => 'Pemuda',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
    ]);

    $category->syncCustomAttributes(['pj' => 'John Doe']);

    $log = AuditLog::where('auditable_type', 'category')
        ->where('auditable_id', $category->id)
        ->where('event', 'attributes_synced')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->new_values)->toHaveKey('pj', 'John Doe');
});
