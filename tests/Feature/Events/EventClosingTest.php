<?php

use App\Enums\Direction;
use App\Enums\EventStatus;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\Event;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Services\EventClosingService;
use App\Services\EventExpenseService;
use App\Services\LedgerService;

beforeEach(function () {
    $this->account = Account::create([
        'code' => 'KAS-OPERASIONAL',
        'name' => 'Kas Operasional',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $this->targetFund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    $this->event = Event::create([
        'name' => 'HUT Gereja 2026',
        'start_date' => '2026-10-01',
        'status' => EventStatus::Active,
        'target_budget' => 50000000,
    ]);

    $this->expenseCategory = Category::create([
        'name' => 'Konsumsi HUT',
        'direction' => Direction::Out,
        'default_fund_id' => $this->event->fund_id,
        'scope_event_id' => $this->event->id,
    ]);
});

it('records event expense debiting the event dedicated fund', function () {
    $expenseService = app(EventExpenseService::class);

    $entry = $expenseService->recordExpense($this->event, [
        'entry_date' => '2026-10-02',
        'account_id' => $this->account->id,
        'category_id' => $this->expenseCategory->id,
        'amount' => 2500000,
        'description' => 'Konsumsi rapat panitia HUT',
    ]);

    expect($entry)->not->toBeNull()
        ->and($entry->fund_id)->toBe($this->event->fund_id)
        ->and($entry->account_id)->toBe($this->account->id)
        ->and($entry->amount)->toBe(2500000)
        ->and($entry->direction)->toBe(Direction::Out)
        ->and(LedgerEntry::getBalance($this->event->fund_id))->toBe(-2500000);
});

it('rejects recording expense on a closed event', function () {
    $this->event->update(['status' => EventStatus::Closed]);
    $expenseService = app(EventExpenseService::class);

    expect(fn () => $expenseService->recordExpense($this->event, [
        'entry_date' => '2026-10-02',
        'account_id' => $this->account->id,
        'category_id' => $this->expenseCategory->id,
        'amount' => 100000,
    ]))->toThrow(InvalidArgumentException::class);
});

it('closes an event with zero balance successfully', function () {
    $closingService = app(EventClosingService::class);

    $result = $closingService->close($this->event);

    expect($result['event']->status)->toBe(EventStatus::Closed)
        ->and($result['transferred_balance'])->toBe(0)
        ->and($this->event->fresh()->isClosed())->toBeTrue()
        ->and($this->event->fund->fresh()->is_active)->toBeFalse();
});

it('closes an event with positive balance by transferring remainder to target fund', function () {
    $ledgerService = app(LedgerService::class);

    // Initial income into event fund: 15.000.000
    $ledgerService->record([
        'entry_date' => '2026-10-01',
        'account_id' => $this->account->id,
        'fund_id' => $this->event->fund_id,
        'amount' => 15000000,
        'direction' => Direction::In,
        'description' => 'Pemasukan HUT',
        'source_type' => 'event',
        'source_id' => $this->event->id,
    ]);

    // An expense of 10.000.000
    $ledgerService->record([
        'entry_date' => '2026-10-05',
        'account_id' => $this->account->id,
        'fund_id' => $this->event->fund_id,
        'amount' => 10000000,
        'direction' => Direction::Out,
        'description' => 'Pengeluaran HUT',
        'source_type' => 'event',
        'source_id' => $this->event->id,
    ]);

    // Remaining balance is 5.000.000
    expect(LedgerEntry::getBalance($this->event->fund_id))->toBe(5000000);

    $closingService = app(EventClosingService::class);
    $result = $closingService->close($this->event, $this->targetFund->id, 'Sisa dana dialihkan ke Kas Umum');

    expect($result['transferred_balance'])->toBe(5000000)
        ->and($this->event->fresh()->isClosed())->toBeTrue()
        ->and($this->event->fund->fresh()->is_active)->toBeFalse()
        // Event fund balance becomes EXACTLY ZERO
        ->and(LedgerEntry::getBalance($this->event->fund_id))->toBe(0)
        // Target fund received EXACTLY 5.000.000
        ->and(LedgerEntry::getBalance($this->targetFund->id))->toBe(5000000);
});

it('handles event closing via controller endpoint', function () {
    $ledgerService = app(LedgerService::class);
    $ledgerService->record([
        'entry_date' => '2026-10-01',
        'account_id' => $this->account->id,
        'fund_id' => $this->event->fund_id,
        'amount' => 3000000,
        'direction' => Direction::In,
        'description' => 'Sponsorship HUT',
        'source_type' => 'event',
        'source_id' => $this->event->id,
    ]);

    actingAsRole(Role::Admin);

    $response = $this->post(route('events.close', $this->event), [
        'target_fund_id' => $this->targetFund->id,
        'notes' => 'Tutup acara panitia HUT',
    ]);

    $response->assertRedirect();
    expect($this->event->fresh()->isClosed())->toBeTrue()
        ->and(LedgerEntry::getBalance($this->event->fund_id))->toBe(0);
});
