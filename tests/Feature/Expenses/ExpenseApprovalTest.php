<?php

use App\Enums\Direction;
use App\Enums\ExpenseStatus;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Services\LedgerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    $this->setting = ChurchSetting::current();
    $this->setting->update([
        'expense_approval_threshold' => 1000000, // 1 juta
        'allow_negative_balance' => false,
    ]);

    $this->account = Account::create([
        'code' => 'KAS-OPERASIONAL',
        'name' => 'Kas Operasional',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    $this->category = Category::create([
        'name' => 'Listrik & Air',
        'direction' => Direction::Out,
        'default_fund_id' => $this->fund->id,
        'is_active' => true,
    ]);

    // Give fund initial balance of 5,000,000 so balance is sufficient
    LedgerService::record([
        'entry_date' => '2026-10-01',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 5000000,
        'direction' => Direction::In,
        'description' => 'Saldo awal',
    ]);
});

it('strictly requires physical proof receipt when submitting an expense', function () {
    $user = actingAsRole(Role::Bendahara);

    $response = $this->post(route('expenses.store'), [
        'payee' => 'PLN',
        'amount' => 500000,
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'description' => 'Tagihan listrik',
        // proof is omitted
    ]);

    $response->assertSessionHasErrors(['proof']);
    expect(Expense::count())->toBe(0);
});

it('creates expense with pending status and stores proof file', function () {
    $user = actingAsRole(Role::Bendahara);
    $file = UploadedFile::fake()->create('nota-pln.jpg', 100, 'image/jpeg');

    $response = $this->post(route('expenses.store'), [
        'payee' => 'PLN Distribusi',
        'amount' => 500000,
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'description' => 'Tagihan listrik gereja',
        'proof' => $file,
    ]);

    $response->assertRedirect();
    $expense = Expense::first();

    expect($expense)->not->toBeNull()
        ->and($expense->status)->toBe(ExpenseStatus::Pending)
        ->and($expense->payee)->toBe('PLN Distribusi')
        ->and($expense->amount)->toBe(500000)
        ->and($expense->submitted_by)->toBe($user->id)
        ->and($expense->expense_number)->toStartWith('EXP-')
        ->and($expense->proof_path)->not->toBeEmpty();

    Storage::disk('public')->assertExists($expense->proof_path);
});

it('prohibits submitter from approving their own expense (anti self-approval)', function () {
    $submitter = actingAsRole(Role::Bendahara);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'Toko Perlengkapan',
        'amount' => 300000,
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    // Submitter tries to approve own expense
    $response = $this->post(route('expenses.approve', $expense->id));
    $response->assertStatus(403);

    $expense->refresh();
    expect($expense->status)->toBe(ExpenseStatus::Pending);
});

it('allows bendahara to approve expense below or equal to threshold', function () {
    $submitter = actingAsRole(Role::Penghitung);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'Toko Alat Tulis',
        'amount' => 800000, // <= threshold 1,000,000
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    $bendahara = actingAsRole(Role::Bendahara);
    $response = $this->post(route('expenses.approve', $expense->id), [
        'notes' => 'Disetujui untuk dibeli',
    ]);

    $response->assertRedirect();
    $expense->refresh();

    expect($expense->status)->toBe(ExpenseStatus::Approved)
        ->and($expense->approved_by)->toBe($bendahara->id)
        ->and($expense->approved_at)->not->toBeNull()
        ->and($expense->notes)->toBe('Disetujui untuk dibeli');
});

it('prohibits bendahara from approving expense exceeding threshold without majelis', function () {
    $submitter = actingAsRole(Role::Penghitung);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'Kontraktor Renovasi',
        'amount' => 2500000, // > threshold 1,000,000
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    $bendahara = actingAsRole(Role::Bendahara);
    $response = $this->post(route('expenses.approve', $expense->id));

    $response->assertStatus(403);
    $expense->refresh();
    expect($expense->status)->toBe(ExpenseStatus::Pending);
});

it('allows majelis to approve expense exceeding threshold', function () {
    $submitter = actingAsRole(Role::Bendahara);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'Kontraktor Renovasi',
        'amount' => 2500000, // > threshold 1,000,000
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    $majelis = actingAsRole(Role::Majelis);
    $response = $this->post(route('expenses.approve', $expense->id), [
        'notes' => 'Disetujui dalam rapat majelis',
    ]);

    $response->assertRedirect();
    $expense->refresh();

    expect($expense->status)->toBe(ExpenseStatus::Approved)
        ->and($expense->approved_by)->toBe($majelis->id);
});

it('allows rejecting an expense with notes', function () {
    $submitter = actingAsRole(Role::Penghitung);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'Pembelian Meja',
        'amount' => 500000,
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    actingAsRole(Role::Bendahara);
    $response = $this->post(route('expenses.reject', $expense->id), [
        'notes' => 'Harga tidak wajar, harap cari perbandingan',
    ]);

    $response->assertRedirect();
    $expense->refresh();

    expect($expense->status)->toBe(ExpenseStatus::Rejected)
        ->and($expense->notes)->toBe('Harga tidak wajar, harap cari perbandingan');
});

it('records ledger entry out when expense is paid by bendahara', function () {
    $submitter = actingAsRole(Role::Penghitung);
    $majelis = actingAsRole(Role::Majelis);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'PDAM',
        'amount' => 450000,
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'description' => 'Air PDAM bulan Oktober',
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Approved,
        'submitted_by' => $submitter->id,
        'approved_by' => $majelis->id,
        'approved_at' => now(),
    ]);

    $bendahara = actingAsRole(Role::Bendahara);
    $response = $this->post(route('expenses.pay', $expense->id));

    $response->assertRedirect();
    $expense->refresh();

    expect($expense->status)->toBe(ExpenseStatus::Paid)
        ->and($expense->paid_at)->not->toBeNull();

    $ledgerEntry = LedgerEntry::where('source_type', 'expense')
        ->where('source_id', $expense->id)
        ->first();

    expect($ledgerEntry)->not->toBeNull()
        ->and($ledgerEntry->direction)->toBe(Direction::Out)
        ->and($ledgerEntry->amount)->toBe(450000)
        ->and($ledgerEntry->account_id)->toBe($this->account->id)
        ->and($ledgerEntry->fund_id)->toBe($this->fund->id)
        ->and($ledgerEntry->category_id)->toBe($this->category->id)
        ->and($ledgerEntry->entry_date->toDateString())->toBe('2026-10-21');

    // Balance decreased by 450,000 (from 5,000,000 to 4,550,000)
    expect(LedgerEntry::getBalance($this->fund->id))->toBe(4550000);
});
