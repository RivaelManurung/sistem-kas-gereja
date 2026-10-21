<?php

use App\Enums\Role;
use App\Models\ServiceSchedule;
use App\Models\ServiceSession;

function makeSession(): ServiceSession
{
    $schedule = ServiceSchedule::create(['name' => 'Ibadah Minggu', 'day_of_week' => 0, 'time' => '09:00']);

    return ServiceSession::create(['service_schedule_id' => $schedule->id, 'date' => '2026-10-18', 'name' => 'Ibadah Minggu']);
}

it('shows the session detail page to counting roles', function () {
    $session = makeSession();
    actingAsRole(Role::Penghitung);

    $this->get(route('sessions.show', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('sessions/show')
            ->where('session.id', $session->id)
            ->where('session.schedule.name', 'Ibadah Minggu')
            ->where('totalCollected', 0)
            ->has('session.count_sheets', 0));
});

it('forbids roles without counting permission from the session detail', function () {
    $session = makeSession();
    actingAsRole(Role::Panitia);

    $this->get(route('sessions.show', $session))->assertForbidden();
});

it('redirects guests away from the session detail', function () {
    $session = makeSession();

    $this->get(route('sessions.show', $session))->assertRedirect(route('login'));
});
