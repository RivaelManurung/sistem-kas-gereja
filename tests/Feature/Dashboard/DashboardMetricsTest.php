<?php

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\ExpenseStatus;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\CountSheet;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\ServiceSession;
use App\Services\LedgerService;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->setting = ChurchSetting::current();
    $this->setting->update([
        'expense_approval_threshold' => 1000000,
        'min_confirmations_service' => 2,
    ]);
});

it('redirects unauthenticated guests to login', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

it('displays current balances per fund and per account accurately from ledger', function () {
    $user = actingAsRole(Role::Bendahara);

    $accCash = Account::create(['code' => 'KAS-TEST', 'name' => 'Kas Tunai', 'type' => 'cash', 'is_active' => true]);
    $accBank = Account::create(['code' => 'BANK-TEST', 'name' => 'Bank BCA', 'type' => 'bank', 'bank_name' => 'BCA', 'account_number' => '123', 'is_active' => true]);

    $fundUmum = Fund::create(['code' => 'UMUM-TEST', 'name' => 'Dana Umum', 'is_active' => true]);
    $fundDiakonia = Fund::create(['code' => 'DIAK-TEST', 'name' => 'Dana Diakonia', 'is_active' => true]);

    // Record ledger entries
    LedgerService::record([
        'entry_date' => '2026-10-10',
        'account_id' => $accCash->id,
        'fund_id' => $fundUmum->id,
        'amount' => 5000000,
        'direction' => Direction::In,
        'description' => 'Pemasukan Kas Umum',
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-11',
        'account_id' => $accBank->id,
        'fund_id' => $fundDiakonia->id,
        'amount' => 2000000,
        'direction' => Direction::In,
        'description' => 'Pemasukan Diakonia Bank',
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-12',
        'account_id' => $accCash->id,
        'fund_id' => $fundUmum->id,
        'amount' => 1000000,
        'direction' => Direction::Out,
        'description' => 'Pengeluaran Kas Umum',
    ]);

    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('fundBalances', fn (Assert $funds) => $funds
            ->where('0.name', 'Dana Diakonia')
            ->where('0.balance', 2000000)
            ->where('1.name', 'Dana Umum')
            ->where('1.balance', 4000000)
            ->etc()
        )
        ->has('accountBalances', fn (Assert $accounts) => $accounts
            ->where('0.name', 'Bank BCA')
            ->where('0.balance', 2000000)
            ->where('1.name', 'Kas Tunai')
            ->where('1.balance', 4000000)
            ->etc()
        )
        ->where('summary.totalBalance', 6000000)
    );
});

it('calculates monthly trend of income and expenses', function () {
    actingAsRole(Role::Bendahara);

    $account = Account::create(['code' => 'KAS-TREND', 'name' => 'Kas Trend', 'type' => 'cash', 'is_active' => true]);
    $fund = Fund::create(['code' => 'DANA-TREND', 'name' => 'Dana Trend', 'is_active' => true]);

    LedgerService::record([
        'entry_date' => '2026-09-15',
        'account_id' => $account->id,
        'fund_id' => $fund->id,
        'amount' => 3000000,
        'direction' => Direction::In,
        'description' => 'In September',
    ]);

    LedgerService::record([
        'entry_date' => '2026-09-20',
        'account_id' => $account->id,
        'fund_id' => $fund->id,
        'amount' => 1000000,
        'direction' => Direction::Out,
        'description' => 'Out September',
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-05',
        'account_id' => $account->id,
        'fund_id' => $fund->id,
        'amount' => 5000000,
        'direction' => Direction::In,
        'description' => 'In October',
    ]);

    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('monthlyTrend')
    );
});

it('provides actionable alerts for count sheets waiting confirmation and verification', function () {
    $user = actingAsRole(Role::Bendahara);

    $account = Account::create(['code' => 'KAS-ALERT', 'name' => 'Kas Alert', 'type' => 'cash', 'is_active' => true]);

    $draftSheet = CountSheet::create([
        'type' => CountSheetType::General,
        'date' => '2026-10-21',
        'account_id' => $account->id,
        'status' => CountSheetStatus::Draft,
        'total_amount' => 1500000,
        'created_by' => $user->id,
    ]);

    $confirmedSheet = CountSheet::create([
        'type' => CountSheetType::General,
        'date' => '2026-10-20',
        'account_id' => $account->id,
        'status' => CountSheetStatus::Confirmed,
        'total_amount' => 2500000,
        'created_by' => $user->id,
    ]);

    // And a locked sheet which should not be in alerts
    CountSheet::create([
        'type' => CountSheetType::General,
        'date' => '2026-10-19',
        'account_id' => $account->id,
        'status' => CountSheetStatus::Locked,
        'total_amount' => 3000000,
        'created_by' => $user->id,
    ]);

    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('alerts.waitingConfirmationCountSheets', 1, fn (Assert $item) => $item
            ->where('id', $draftSheet->id)
            ->where('total_amount', 1500000)
            ->etc()
        )
        ->has('alerts.waitingVerificationCountSheets', 1, fn (Assert $item) => $item
            ->where('id', $confirmedSheet->id)
            ->where('total_amount', 2500000)
            ->etc()
        )
    );
});

it('provides actionable alerts for expenses waiting approval with threshold warning badge', function () {
    $submitter = actingAsRole(Role::Penghitung);

    $account = Account::create(['code' => 'KAS-EXP', 'name' => 'Kas Pengeluaran', 'type' => 'cash', 'is_active' => true]);
    $fund = Fund::create(['code' => 'DANA-EXP', 'name' => 'Dana Pengeluaran', 'is_active' => true]);
    $cat = Category::create(['name' => 'Operasional', 'direction' => Direction::Out, 'default_fund_id' => $fund->id, 'is_active' => true]);

    $normalExpense = Expense::create([
        'expense_number' => 'EXP-001',
        'payee' => 'Toko Buku',
        'amount' => 500000, // <= threshold 1,000,000
        'date' => '2026-10-21',
        'account_id' => $account->id,
        'fund_id' => $fund->id,
        'category_id' => $cat->id,
        'proof_path' => 'expenses/nota1.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    $largeExpense = Expense::create([
        'expense_number' => 'EXP-002',
        'payee' => 'Kontraktor Atap',
        'amount' => 5000000, // > threshold 1,000,000
        'date' => '2026-10-21',
        'account_id' => $account->id,
        'fund_id' => $fund->id,
        'category_id' => $cat->id,
        'proof_path' => 'expenses/nota2.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    // Approved expense should not be in pending alerts
    Expense::create([
        'expense_number' => 'EXP-003',
        'payee' => 'PLN',
        'amount' => 300000,
        'date' => '2026-10-21',
        'account_id' => $account->id,
        'fund_id' => $fund->id,
        'category_id' => $cat->id,
        'proof_path' => 'expenses/nota3.jpg',
        'status' => ExpenseStatus::Approved,
        'submitted_by' => $submitter->id,
    ]);

    actingAsRole(Role::Majelis);
    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('alerts.waitingApprovalExpenses', 2)
        ->has('alerts.waitingApprovalExpenses.0', fn (Assert $item) => $item
            ->where('id', $normalExpense->id)
            ->where('is_above_threshold', false)
            ->etc()
        )
        ->has('alerts.waitingApprovalExpenses.1', fn (Assert $item) => $item
            ->where('id', $largeExpense->id)
            ->where('is_above_threshold', true)
            ->etc()
        )
    );
});

it('provides actionable alerts for uncounted service sessions', function () {
    $user = actingAsRole(Role::Penghitung);

    $uncounted = ServiceSession::create([
        'name' => 'Kebaktian Minggu Pagi I',
        'date' => '2026-10-21',
        'is_completed' => false,
    ]);

    $counted = ServiceSession::create([
        'name' => 'Kebaktian Minggu Sore',
        'date' => '2026-10-21',
        'is_completed' => true,
    ]);

    $account = Account::create(['code' => 'KAS-SESSION', 'name' => 'Kas Sesi', 'type' => 'cash', 'is_active' => true]);
    CountSheet::create([
        'type' => CountSheetType::Service,
        'service_session_id' => $counted->id,
        'date' => '2026-10-21',
        'account_id' => $account->id,
        'status' => CountSheetStatus::Draft,
        'total_amount' => 1000000,
        'created_by' => $user->id,
    ]);

    $response = $this->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('alerts.uncountedSessions', 1, fn (Assert $item) => $item
            ->where('id', $uncounted->id)
            ->where('name', 'Kebaktian Minggu Pagi I')
            ->etc()
        )
    );
});
