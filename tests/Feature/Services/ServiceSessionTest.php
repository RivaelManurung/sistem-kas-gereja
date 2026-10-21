<?php

use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Fund;
use App\Models\ServiceSchedule;
use App\Models\ServiceSession;

beforeEach(function () {
    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
    ]);

    $this->kolekte = Category::create([
        'name' => 'Kolekte Umum',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
    ]);
});

it('creates and manages service schedules', function () {
    actingAsRole(Role::Admin);

    $this->post(route('admin.schedules.store'), [
        'name' => 'Ibadah Raya 1',
        'day_of_week' => 0, // Minggu
        'time' => '08:00',
        'default_category_ids' => [$this->kolekte->id],
    ])->assertRedirect(route('admin.schedules.index'));

    $schedule = ServiceSchedule::first();
    expect($schedule)->not->toBeNull()
        ->and($schedule->name)->toBe('Ibadah Raya 1')
        ->and($schedule->default_category_ids)->toBe([$this->kolekte->id]);
});

it('creates session from schedule without duplicate on same date', function () {
    actingAsRole(Role::Penghitung);

    $schedule = ServiceSchedule::create([
        'name' => 'Ibadah Minggu Pagi',
        'day_of_week' => 0,
        'time' => '09:00',
        'default_category_ids' => [$this->kolekte->id],
    ]);

    $date = '2026-10-25';

    // First creation succeeds
    $this->post(route('sessions.store'), [
        'service_schedule_id' => $schedule->id,
        'date' => $date,
    ])->assertRedirect();

    $session = ServiceSession::where('service_schedule_id', $schedule->id)
        ->where('date', $date)
        ->first();

    expect($session)->not->toBeNull()
        ->and($session->name)->toBe('Ibadah Minggu Pagi');

    // Duplicate creation on same schedule & date is rejected
    $this->post(route('sessions.store'), [
        'service_schedule_id' => $schedule->id,
        'date' => $date,
    ])->assertSessionHasErrors(['date']);
});

it('allows creating ad-hoc service session without schedule', function () {
    actingAsRole(Role::Penghitung);

    $this->post(route('sessions.store'), [
        'name' => 'Ibadah Pelepasan Jenazah',
        'date' => '2026-10-22',
        'notes' => 'Ibadah keluarga Bapak Anton',
    ])->assertRedirect();

    $session = ServiceSession::where('name', 'Ibadah Pelepasan Jenazah')->first();
    expect($session)->not->toBeNull()
        ->and($session->service_schedule_id)->toBeNull();
});
