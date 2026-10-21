<?php

use App\Enums\Direction;
use App\Enums\ExpenseStatus;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\Event;
use App\Models\LedgerEntry;
use App\Models\User;
use App\Services\EventExpenseService;
use App\Services\ExpenseService;
use App\Services\LedgerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    $this->account = Account::create([
        'code' => 'KAS-EVENT',
        'name' => 'Kas Operasional Acara',
        'type' => 'cash',
    ]);

    $this->event = Event::create([
        'name' => 'Paskah Raya 2026',
        'theme' => 'Kebangkitan Kristus',
        'start_date' => '2026-04-01',
        'end_date' => '2026-04-05',
    ]);

    $this->category = Category::create([
        'name' => 'Konsumsi Acara Paskah',
        'direction' => Direction::Out,
        'default_fund_id' => $this->event->fund_id,
        'scope_event_id' => $this->event->id,
    ]);

    // Give event fund some initial balance
    app(LedgerService::class)->record([
        'entry_date' => '2026-04-01',
        'account_id' => $this->account->id,
        'fund_id' => $this->event->fund_id,
        'category_id' => null,
        'amount' => 5000000,
        'direction' => Direction::In,
        'description' => 'Saldo Awal Dana Paskah',
    ]);
});

it('unites event expenses with the multi-tier approval pipeline and posts ledger entries scoped to event fund', function () {
    $submitter = User::factory()->create();
    $submitter->assignRole(Role::Penghitung->value);

    $bendahara = User::factory()->create();
    $bendahara->assignRole(Role::Bendahara->value);

    $eventExpenseService = app(EventExpenseService::class);
    $expenseService = app(ExpenseService::class);

    $fakeNota = UploadedFile::fake()->create('nota_konsumsi.jpg', 100);

    // 1. Submit expense for event
    $expense = $eventExpenseService->submitExpense($this->event, [
        'payee' => 'Catering Berkat',
        'amount' => 1500000,
        'date' => '2026-04-02',
        'account_id' => $this->account->id,
        'category_id' => $this->category->id,
        'description' => 'Konsumsi gladi bersih Paskah',
    ], $submitter, $fakeNota);

    expect($expense)->not->toBeNull()
        ->and($expense->event_id)->toBe($this->event->id)
        ->and($expense->fund_id)->toBe($this->event->fund_id)
        ->and($expense->status)->toBe(ExpenseStatus::Pending);

    // 2. Anti self-approval check
    expect(fn () => $expenseService->approve($expense, $submitter))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);

    // 3. Bendahara approves
    $approvedExpense = $expenseService->approve($expense, $bendahara);
    expect($approvedExpense->status)->toBe(ExpenseStatus::Approved)
        ->and($approvedExpense->approved_by)->toBe($bendahara->id);

    // 4. Bendahara pays the expense -> posts to ledger
    $paidExpense = $expenseService->pay($approvedExpense, $bendahara);
    expect($paidExpense->status)->toBe(ExpenseStatus::Paid);

    // 5. Verify ledger entry scoped to event fund
    $entry = LedgerEntry::where('source_type', 'expense')
        ->where('source_id', $paidExpense->id)
        ->first();

    expect($entry)->not->toBeNull()
        ->and($entry->fund_id)->toBe($this->event->fund_id)
        ->and($entry->amount)->toBe(1500000)
        ->and($entry->direction)->toBe(Direction::Out);

    // 6. Verify event balance reduced from 5m to 3.5m
    expect(LedgerEntry::getBalance($this->event->fund_id))->toBe(3500000);
});

it('rejects submitting event expense if event is closed', function () {
    $submitter = User::factory()->create();
    $submitter->assignRole(Role::Penghitung->value);

    $this->event->update(['status' => \App\Enums\EventStatus::Closed]);

    $fakeNota = UploadedFile::fake()->create('nota.jpg', 100);
    $service = app(EventExpenseService::class);

    expect(fn () => $service->submitExpense($this->event, [
        'payee' => 'Toko Alat',
        'amount' => 200000,
        'date' => '2026-04-02',
        'account_id' => $this->account->id,
        'category_id' => $this->category->id,
    ], $submitter, $fakeNota))->toThrow(InvalidArgumentException::class);
});
