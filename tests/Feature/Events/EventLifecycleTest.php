<?php

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Enums\EventRole;
use App\Enums\EventStatus;
use App\Enums\Role;
use App\Models\AttributeDefinition;
use App\Models\Event;
use App\Models\EventMember;
use App\Models\Fund;
use App\Models\Member;
use App\Models\User;

it('automatically provisions a dedicated fund when an event is created', function () {
    $event = Event::create([
        'name' => 'Paskah 2026',
        'theme' => 'Kebangkitan Kristus Harapan Kita',
        'start_date' => '2026-04-01',
        'end_date' => '2026-04-05',
        'status' => EventStatus::Planning,
        'target_budget' => 25000000,
        'description' => 'Rangkaian perayaan Paskah gereja tahun 2026',
    ]);

    expect($event->fund_id)->not->toBeNull();
    $fund = Fund::find($event->fund_id);
    expect($fund)->not->toBeNull()
        ->and($fund->name)->toBe('Dana Acara: Paskah 2026')
        ->and($fund->code)->toStartWith('EVT-')
        ->and($fund->is_active)->toBeTrue()
        ->and($fund->event_id)->toBe($event->id);
});

it('manages event committee members with distinct roles', function () {
    $event = Event::create([
        'name' => 'Retreat Pemuda 2026',
        'start_date' => '2026-06-10',
        'status' => EventStatus::Planning,
    ]);

    $userLeader = User::factory()->create(['name' => 'Ketua Panitia']);
    $userSecretary = User::factory()->create(['name' => 'Sekretaris Panitia']);
    $member = Member::create([
        'code' => 'JEM-001',
        'name' => 'Anggota Jemaat Aktif',
        'phone' => '08123456789',
        'is_active' => true,
    ]);

    $memberKetua = EventMember::create([
        'event_id' => $event->id,
        'user_id' => $userLeader->id,
        'role_in_event' => EventRole::Ketua,
        'notes' => 'Koordinator umum',
    ]);

    $memberSekretaris = EventMember::create([
        'event_id' => $event->id,
        'user_id' => $userSecretary->id,
        'role_in_event' => EventRole::Sekretaris,
    ]);

    $memberAnggota = EventMember::create([
        'event_id' => $event->id,
        'member_id' => $member->id,
        'role_in_event' => EventRole::Anggota,
        'notes' => 'Seksi Perlengkapan',
    ]);

    expect($event->members)->toHaveCount(3)
        ->and($memberKetua->role_in_event)->toBe(EventRole::Ketua)
        ->and($memberKetua->user->name)->toBe('Ketua Panitia')
        ->and($memberAnggota->member->name)->toBe('Anggota Jemaat Aktif');
});

it('updates event status through valid lifecycles', function () {
    $event = Event::create([
        'name' => 'Seminar Keluarga 2026',
        'start_date' => '2026-05-15',
        'status' => EventStatus::Planning,
    ]);

    expect($event->status)->toBe(EventStatus::Planning);

    $event->update(['status' => EventStatus::Active]);
    expect($event->fresh()->status)->toBe(EventStatus::Active);

    $event->update(['status' => EventStatus::Completed]);
    expect($event->fresh()->status)->toBe(EventStatus::Completed);
});

it('supports custom EAV attributes on events', function () {
    $definition = AttributeDefinition::create([
        'entity_type' => AttributeEntity::Event,
        'key' => 'lokasi_acara',
        'label' => 'Lokasi Acara',
        'data_type' => AttributeType::Text,
        'is_required' => false,
        'is_active' => true,
    ]);

    $event = Event::create([
        'name' => 'Bakti Sosial 2026',
        'start_date' => '2026-08-17',
    ]);

    $event->syncCustomAttributes([
        'lokasi_acara' => 'Gedung Serbaguna Betlehem',
    ]);

    $attributes = $event->customAttributes();
    expect($attributes)->toHaveKey('lokasi_acara')
        ->and($attributes['lokasi_acara'])->toBe('Gedung Serbaguna Betlehem');
});

it('isolates event scoped categories from general categories', function () {
    $event1 = Event::create(['name' => 'Konser Musik Rohani 2026', 'start_date' => '2026-07-01']);
    $event2 = Event::create(['name' => 'Klinik Kesehatan 2026', 'start_date' => '2026-07-05']);

    // General category
    $generalCat = \App\Models\Category::create([
        'name' => 'Kolekte Rutin',
        'direction' => \App\Enums\Direction::In,
        'default_fund_id' => Fund::where('code', 'UMUM')->first()->id ?? Fund::first()->id,
        'scope_event_id' => null,
    ]);

    // Event 1 category
    $event1Cat = \App\Models\Category::create([
        'name' => 'Tiket Konser',
        'direction' => \App\Enums\Direction::In,
        'default_fund_id' => $event1->fund_id,
        'scope_event_id' => $event1->id,
    ]);

    // Event 2 category with same name (allowed because different scope_event_id!)
    $event2Cat = \App\Models\Category::create([
        'name' => 'Tiket Konser',
        'direction' => \App\Enums\Direction::In,
        'default_fund_id' => $event2->fund_id,
        'scope_event_id' => $event2->id,
    ]);

    // General query must NOT include event scoped categories
    $generalCategories = \App\Models\Category::general()->get();
    expect($generalCategories->pluck('id'))->toContain($generalCat->id)
        ->and($generalCategories->pluck('id'))->not->toContain($event1Cat->id)
        ->and($generalCategories->pluck('id'))->not->toContain($event2Cat->id);

    // Query for event 1 must include event 1 category, but NOT event 2 category
    $event1Categories = \App\Models\Category::forEvent($event1->id, includeGeneral: false)->get();
    expect($event1Categories->pluck('id'))->toContain($event1Cat->id)
        ->and($event1Categories->pluck('id'))->not->toContain($event2Cat->id);
});

it('supports custom attribute definitions scoped to an event', function () {
    $event = Event::create(['name' => 'Porseni Remaja 2026', 'start_date' => '2026-09-01']);

    $scopedDef = AttributeDefinition::create([
        'entity_type' => AttributeEntity::CountSheet,
        'key' => 'posko_lapangan',
        'label' => 'Posko Lapangan',
        'data_type' => AttributeType::Text,
        'is_required' => false,
        'is_active' => true,
        'scope_event_id' => $event->id,
    ]);

    expect($event->attributeDefinitions)->toHaveCount(1)
        ->and($event->attributeDefinitions->first()->key)->toBe('posko_lapangan');

    $generalDefs = AttributeDefinition::forEntity(AttributeEntity::CountSheet, null)->get();
    expect($generalDefs->pluck('id'))->not->toContain($scopedDef->id);

    $eventDefs = AttributeDefinition::forEntity(AttributeEntity::CountSheet, $event->id)->get();
    expect($eventDefs->pluck('id'))->toContain($scopedDef->id);
});

it('lists events with calculated financial summary metrics', function () {
    $event = Event::create([
        'name' => 'Konser Paskah 2026',
        'start_date' => '2026-04-10',
        'target_budget' => 20000000,
        'status' => EventStatus::Active,
    ]);

    $account = \App\Models\Account::create([
        'code' => 'KAS-ACR',
        'name' => 'Kas Acara',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $ledgerService = app(\App\Services\LedgerService::class);
    // Income: 12.000.000
    $ledgerService->record([
        'entry_date' => '2026-04-10',
        'account_id' => $account->id,
        'fund_id' => $event->fund_id,
        'amount' => 12000000,
        'direction' => \App\Enums\Direction::In,
        'description' => 'Penjualan tiket',
        'source_type' => 'event',
        'source_id' => $event->id,
    ]);

    // Expense: 8.000.000
    $ledgerService->record([
        'entry_date' => '2026-04-11',
        'account_id' => $account->id,
        'fund_id' => $event->fund_id,
        'amount' => 8000000,
        'direction' => \App\Enums\Direction::Out,
        'description' => 'Sound system',
        'source_type' => 'event',
        'source_id' => $event->id,
    ]);

    actingAsRole(Role::Admin);

    $response = $this->get(route('events.index'));
    $response->assertOk();

    $pageEvents = $response->viewData('page')['props']['events']['data'];
    $eventData = collect($pageEvents)->firstWhere('id', $event->id);

    expect($eventData)->not->toBeNull()
        ->and($eventData['financial_summary']['total_income'])->toBe(12000000)
        ->and($eventData['financial_summary']['total_expenses'])->toBe(8000000)
        ->and($eventData['financial_summary']['remaining_balance'])->toBe(4000000)
        ->and($eventData['financial_summary']['budget_realization_pct'])->toBe(40.0);
});

it('creates an event via controller endpoint', function () {
    actingAsRole(Role::Admin);

    $response = $this->post(route('events.store'), [
        'name' => 'Kemah Pemuda 2026',
        'theme' => 'Teguh Berakar Bertumbuh',
        'start_date' => '2026-07-20',
        'end_date' => '2026-07-23',
        'status' => EventStatus::Active->value,
        'target_budget' => 35000000,
        'description' => 'Kegiatan kemah rohani pemuda remaja di bumi perkemahan',
    ]);

    $response->assertRedirect();
    $event = Event::where('name', 'Kemah Pemuda 2026')->first();

    expect($event)->not->toBeNull()
        ->and($event->fund_id)->not->toBeNull()
        ->and($event->fund->name)->toBe('Dana Acara: Kemah Pemuda 2026');
});

it('manages committee members and categories via dedicated endpoints', function () {
    $event = Event::create(['name' => 'Natal Sekolah Minggu 2026', 'start_date' => '2026-12-20']);
    $user = User::factory()->create();

    actingAsRole(Role::Admin);

    // Add committee member
    $memberResponse = $this->post(route('events.members.store', $event), [
        'user_id' => $user->id,
        'role_in_event' => EventRole::Ketua->value,
        'notes' => 'Koordinator acara',
    ]);
    $memberResponse->assertRedirect();
    expect($event->members)->toHaveCount(1)
        ->and($event->members->first()->role_in_event)->toBe(EventRole::Ketua);

    // Add event category
    $categoryResponse = $this->post(route('events.categories.store', $event), [
        'name' => 'Donasi Bingkisan Anak',
        'direction' => \App\Enums\Direction::In->value,
    ]);
    $categoryResponse->assertRedirect();
    expect($event->categories)->toHaveCount(1)
        ->and($event->categories->first()->name)->toBe('Donasi Bingkisan Anak')
        ->and($event->categories->first()->default_fund_id)->toBe($event->fund_id);
});

it('prevents deleting an event with ledger transactions', function () {
    $event = Event::create(['name' => 'Piknik Gereja 2026', 'start_date' => '2026-08-01']);
    $account = \App\Models\Account::create([
        'code' => 'KAS-PIKNIK',
        'name' => 'Kas Piknik',
        'type' => 'cash',
        'is_active' => true,
    ]);

    app(\App\Services\LedgerService::class)->record([
        'entry_date' => '2026-08-01',
        'account_id' => $account->id,
        'fund_id' => $event->fund_id,
        'amount' => 500000,
        'direction' => \App\Enums\Direction::In,
        'description' => 'Iuran piknik',
        'source_type' => 'event',
        'source_id' => $event->id,
    ]);

    actingAsRole(Role::Admin);

    $response = $this->delete(route('events.destroy', $event));
    $response->assertRedirect();
    expect(Event::find($event->id))->not->toBeNull();
});
