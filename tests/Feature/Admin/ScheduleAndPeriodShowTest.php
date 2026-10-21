<?php

use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\ServiceSchedule;
use App\Models\ServiceSession;

it('shows the schedule detail with its sessions', function () {
    $schedule = ServiceSchedule::create(['name' => 'Ibadah Minggu', 'day_of_week' => 0, 'time' => '09:00', 'default_category_ids' => []]);
    ServiceSession::create(['service_schedule_id' => $schedule->id, 'date' => '2026-10-18', 'name' => 'Ibadah Minggu']);
    actingAsRole(Role::Admin);

    $this->get(route('admin.schedules.show', $schedule))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/schedules/show')
            ->where('dayName', 'Minggu')
            ->where('sessionsCount', 1)
            ->has('sessions', 1));
});

it('shows the period detail with opening balances and totals', function () {
    $period = AccountingPeriod::create(['name' => 'Oktober 2026', 'start_date' => '2026-10-01', 'end_date' => '2026-10-31']);
    $acc = Account::create(['code' => 'KAS', 'name' => 'Kas Tunai', 'type' => 'cash']);
    $fund = Fund::create(['code' => 'UMUM', 'name' => 'Dana Umum']);
    $entry = fn (int $amount, Direction $dir, ?string $type, ?int $id) => LedgerEntry::create([
        'entry_date' => '2026-10-05', 'account_id' => $acc->id, 'fund_id' => $fund->id, 'amount' => $amount,
        'direction' => $dir->value, 'description' => 'x', 'source_type' => $type, 'source_id' => $id,
    ]);
    $entry(1000000, Direction::In, 'accounting_period', $period->id);
    $entry(300000, Direction::In, null, null);
    $entry(100000, Direction::Out, null, null);
    actingAsRole(Role::Admin);

    $this->get(route('admin.periods.show', $period))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/periods/show')
            ->where('totalIncome', 300000)
            ->where('totalExpense', 100000)
            ->has('openingBalances', 1));
});

it('forbids non-master roles and redirects guests', function () {
    $schedule = ServiceSchedule::create(['name' => 'Ibadah', 'day_of_week' => 0, 'time' => '09:00']);
    $period = AccountingPeriod::create(['name' => 'P', 'start_date' => '2026-10-01', 'end_date' => '2026-10-31']);

    auth()->logout();
    $this->get(route('admin.schedules.show', $schedule))->assertRedirect(route('login'));
    $this->get(route('admin.periods.show', $period))->assertRedirect(route('login'));

    actingAsRole(Role::Panitia);
    $this->get(route('admin.schedules.show', $schedule))->assertForbidden();
    $this->get(route('admin.periods.show', $period))->assertForbidden();
});
