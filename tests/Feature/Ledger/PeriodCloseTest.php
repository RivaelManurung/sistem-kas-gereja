<?php

use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\Category;
use App\Models\CountSheet;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Services\AccountingPeriodService;
use App\Services\LedgerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    $this->account = Account::create([
        'code' => 'KAS-1',
        'name' => 'Kas Tunai',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    $this->categoryIn = Category::create([
        'name' => 'Persembahan',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'is_active' => true,
    ]);

    $this->categoryOut = Category::create([
        'name' => 'Operasional',
        'direction' => Direction::Out,
        'default_fund_id' => $this->fund->id,
        'is_active' => true,
    ]);
});

it('creates accounting period and records opening balance into ledger', function () {
    $admin = actingAsRole(Role::Admin);
    $periodService = app(AccountingPeriodService::class);

    $period = AccountingPeriod::create([
        'name' => 'Periode Pembuka 2026',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-31',
    ]);

    $entry = $periodService->recordOpeningBalance($period, [
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 15000000,
        'date' => '2026-01-01',
    ]);

    expect($entry)->not->toBeNull()
        ->and($entry->direction)->toBe(Direction::In)
        ->and($entry->amount)->toBe(15000000)
        ->and($entry->source_type)->toBe('accounting_period')
        ->and($entry->source_id)->toBe($period->id);

    expect(LedgerEntry::getBalance($this->fund->id))->toBe(15000000);
});

it('closes an accounting period successfully', function () {
    $admin = actingAsRole(Role::Admin);
    $period = AccountingPeriod::create([
        'name' => 'Bulan Januari 2026',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-31',
        'is_closed' => false,
    ]);

    $response = $this->post(route('admin.periods.close', $period->id));
    $response->assertRedirect(route('admin.periods.index'));

    $period->refresh();
    expect($period->is_closed)->toBeTrue()
        ->and($period->closed_at)->not->toBeNull()
        ->and($period->closed_by)->toBe($admin->id);

    expect(AccountingPeriod::isDateClosed('2026-01-15'))->toBeTrue()
        ->and(AccountingPeriod::isDateClosed('2026-02-01'))->toBeFalse();
});

it('strictly rejects any new ledger entry insertion on a date within a closed period', function () {
    $admin = actingAsRole(Role::Admin);
    $period = AccountingPeriod::create([
        'name' => 'Januari 2026',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-31',
        'is_closed' => true,
        'closed_at' => now(),
        'closed_by' => $admin->id,
    ]);

    // Attempting via LedgerService::record
    expect(function () {
        LedgerService::record([
            'entry_date' => '2026-01-20', // inside closed period
            'account_id' => $this->account->id,
            'fund_id' => $this->fund->id,
            'amount' => 500000,
            'direction' => Direction::In,
        ]);
    })->toThrow(\DomainException::class);

    // Attempting via direct model create
    expect(function () {
        LedgerEntry::create([
            'entry_date' => '2026-01-20',
            'account_id' => $this->account->id,
            'fund_id' => $this->fund->id,
            'amount' => 500000,
            'direction' => 'in',
        ]);
    })->toThrow(\DomainException::class);
});

it('rejects count sheet creation on a date within a closed period', function () {
    $admin = actingAsRole(Role::Admin);
    AccountingPeriod::create([
        'name' => 'Januari 2026',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-31',
        'is_closed' => true,
        'closed_at' => now(),
        'closed_by' => $admin->id,
    ]);

    // Validation via controller endpoint
    actingAsRole(Role::Penghitung);
    $response = $this->post(route('counting.store'), [
        'type' => CountSheetType::General->value,
        'account_id' => $this->account->id,
        'date' => '2026-01-15', // inside closed period
        'lines' => [
            [
                'category_id' => $this->categoryIn->id,
                'is_cash' => true,
                'amount' => 500000,
            ],
        ],
    ]);

    $response->assertSessionHasErrors(['date']);
    expect(CountSheet::count())->toBe(0);

    // Model level protection
    expect(function () {
        CountSheet::create([
            'type' => CountSheetType::General,
            'account_id' => $this->account->id,
            'date' => '2026-01-15',
            'status' => 'draft',
            'total_amount' => 500000,
        ]);
    })->toThrow(\DomainException::class);
});

it('rejects expense submission on a date within a closed period', function () {
    $admin = actingAsRole(Role::Admin);
    AccountingPeriod::create([
        'name' => 'Januari 2026',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-31',
        'is_closed' => true,
        'closed_at' => now(),
        'closed_by' => $admin->id,
    ]);

    actingAsRole(Role::Bendahara);
    $file = UploadedFile::fake()->create('nota.jpg', 100, 'image/jpeg');

    $response = $this->post(route('expenses.store'), [
        'payee' => 'Toko Alat',
        'amount' => 300000,
        'date' => '2026-01-10', // inside closed period
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->categoryOut->id,
        'proof' => $file,
    ]);

    $response->assertSessionHasErrors(['date']);
    expect(Expense::count())->toBe(0);

    // Model level protection
    expect(function () {
        Expense::create([
            'expense_number' => Expense::generateExpenseNumber(),
            'payee' => 'Toko Alat',
            'amount' => 300000,
            'date' => '2026-01-10',
            'account_id' => $this->account->id,
            'fund_id' => $this->fund->id,
            'category_id' => $this->categoryOut->id,
            'proof_path' => 'expenses/nota.jpg',
            'status' => 'pending',
            'submitted_by' => 1,
        ]);
    })->toThrow(\DomainException::class);
});

it('allows transactions on open periods and outside closed periods', function () {
    $admin = actingAsRole(Role::Admin);
    AccountingPeriod::create([
        'name' => 'Januari 2026',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-31',
        'is_closed' => true,
        'closed_at' => now(),
        'closed_by' => $admin->id,
    ]);

    // Transaction in February (outside January closed period)
    $entry = LedgerService::record([
        'entry_date' => '2026-02-15',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 1000000,
        'direction' => Direction::In,
        'description' => 'Penerimaan Februari',
    ]);

    expect($entry)->not->toBeNull()
        ->and($entry->amount)->toBe(1000000);
});
