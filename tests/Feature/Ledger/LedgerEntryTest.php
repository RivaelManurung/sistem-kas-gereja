<?php

use App\Enums\AccountType;
use App\Enums\Direction;
use App\Models\Account;
use App\Models\Category;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Services\LedgerService;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->account = Account::create([
        'code' => 'KAS',
        'name' => 'Kas Tunai',
        'type' => AccountType::Cash,
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
    ]);

    $this->category = Category::create([
        'name' => 'Kolekte',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
    ]);
});

it('records ledger entries through service', function () {
    $entry = LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'amount' => 1500000,
        'direction' => Direction::In,
        'description' => 'Kolekte Ibadah Minggu',
    ]);

    expect($entry)->toBeInstanceOf(LedgerEntry::class)
        ->and($entry->amount)->toBe(1500000)
        ->and($entry->direction)->toBe(Direction::In);

    expect(LedgerEntry::getBalance($this->fund->id))->toBe(1500000);
    expect(LedgerEntry::getAccountBalance($this->account->id))->toBe(1500000);
});

it('blocks updating or deleting a ledger entry at model and database level', function () {
    $entry = LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 500000,
        'direction' => Direction::In,
    ]);

    // Model level update
    expect(fn () => $entry->update(['amount' => 1000000]))
        ->toThrow(LogicException::class);

    // Model level delete
    expect(fn () => $entry->delete())
        ->toThrow(LogicException::class);

    // Database level update
    expect(fn () => DB::table('ledger_entries')->where('id', $entry->id)->update(['amount' => 1000000]))
        ->toThrow(Exception::class);

    // Database level delete
    expect(fn () => DB::table('ledger_entries')->where('id', $entry->id)->delete())
        ->toThrow(Exception::class);
});

it('creates reversal entry when correcting an entry', function () {
    $original = LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 500000,
        'direction' => Direction::In,
        'description' => 'Salah catat',
    ]);

    expect(LedgerEntry::getBalance($this->fund->id))->toBe(500000);

    $reversal = LedgerService::reverse($original, 'Koreksi salah nominal');

    expect($reversal->reverses_id)->toBe($original->id)
        ->and($reversal->direction)->toBe(Direction::Out)
        ->and($reversal->amount)->toBe(500000);

    // Balance is now 0
    expect(LedgerEntry::getBalance($this->fund->id))->toBe(0);
});

it('enforces idempotency key uniqueness', function () {
    $key = 'test-idempotency-key-1';

    LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 100000,
        'direction' => Direction::In,
        'idempotency_key' => $key,
    ]);

    expect(fn () => LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 100000,
        'direction' => Direction::In,
        'idempotency_key' => $key,
    ]))->toThrow(Exception::class);
});
