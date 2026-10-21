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
