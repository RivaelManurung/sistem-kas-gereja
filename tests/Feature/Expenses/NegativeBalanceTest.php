<?php

use App\Enums\Direction;
use App\Enums\ExpenseStatus;
use App\Enums\FundTransferStatus;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\FundTransfer;
use App\Models\LedgerEntry;
use App\Services\LedgerService;

beforeEach(function () {
    $this->setting = ChurchSetting::current();
    $this->setting->update([
        'expense_approval_threshold' => 0,
        'allow_negative_balance' => false,
    ]);

    $this->account = Account::create([
        'code' => 'KAS-1',
        'name' => 'Kas Utama',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $this->fund = Fund::create([
        'code' => 'DIAK',
        'name' => 'Dana Diakonia',
        'is_active' => true,
    ]);

    $this->otherFund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    $this->category = Category::create([
        'name' => 'Bantuan Sosial',
        'direction' => Direction::Out,
        'default_fund_id' => $this->fund->id,
        'is_active' => true,
    ]);

    // Give Dana Diakonia an initial balance of only Rp 200,000
    LedgerService::record([
        'entry_date' => '2026-10-01',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 200000,
        'direction' => Direction::In,
        'description' => 'Saldo awal diakonia',
    ]);

    expect(LedgerEntry::getBalance($this->fund->id))->toBe(200000);
});

it('rejects expense approval if fund balance is insufficient when allow_negative_balance is false', function () {
    $submitter = actingAsRole(Role::Penghitung);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'Keluarga Binaan',
        'amount' => 1000000, // 1,000,000 > balance 200,000
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    actingAsRole(Role::Bendahara);
    $response = $this->post(route('expenses.approve', $expense->id));

    $response->assertSessionHasErrors(['fund_id']);
    $expense->refresh();
    expect($expense->status)->toBe(ExpenseStatus::Pending);
});

it('rejects expense payment if fund balance has become insufficient when allow_negative_balance is false', function () {
    $submitter = actingAsRole(Role::Penghitung);
    $approver = actingAsRole(Role::Majelis);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'Keluarga Binaan',
        'amount' => 500000, // 500,000 > balance 200,000
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Approved, // already approved earlier when balance might have been sufficient
        'submitted_by' => $submitter->id,
        'approved_by' => $approver->id,
        'approved_at' => now(),
    ]);

    actingAsRole(Role::Bendahara);
    $response = $this->post(route('expenses.pay', $expense->id));

    $response->assertSessionHasErrors(['fund_id']);
    $expense->refresh();
    expect($expense->status)->toBe(ExpenseStatus::Approved);
});

it('rejects fund transfer approval if source fund balance is insufficient when allow_negative_balance is false', function () {
    $requester = actingAsRole(Role::Penghitung);

    $transfer = FundTransfer::create([
        'from_fund_id' => $this->fund->id, // balance 200,000
        'to_fund_id' => $this->otherFund->id,
        'account_id' => $this->account->id,
        'amount' => 500000, // 500,000 > 200,000
        'transfer_date' => '2026-10-21',
        'reason' => 'Transfer sebagian ke Kas Umum',
        'status' => FundTransferStatus::Pending,
        'requested_by' => $requester->id,
    ]);

    actingAsRole(Role::Bendahara);
    $response = $this->post(route('transfers.approve', $transfer->id));

    $response->assertSessionHasErrors(['amount']);
    $transfer->refresh();
    expect($transfer->status)->toBe(FundTransferStatus::Pending);
});

it('allows expense approval and payment to result in negative balance when allow_negative_balance is true', function () {
    $this->setting->update([
        'allow_negative_balance' => true,
    ]);

    $submitter = actingAsRole(Role::Penghitung);

    $expense = Expense::create([
        'expense_number' => Expense::generateExpenseNumber(),
        'payee' => 'Rumah Sakit',
        'amount' => 1000000, // 1,000,000 > balance 200,000
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $this->category->id,
        'proof_path' => 'expenses/nota.jpg',
        'status' => ExpenseStatus::Pending,
        'submitted_by' => $submitter->id,
    ]);

    $approver = actingAsRole(Role::Bendahara);
    $this->post(route('expenses.approve', $expense->id))->assertRedirect();

    $expense->refresh();
    expect($expense->status)->toBe(ExpenseStatus::Approved);

    // Bendahara pays it
    $this->post(route('expenses.pay', $expense->id))->assertRedirect();

    $expense->refresh();
    expect($expense->status)->toBe(ExpenseStatus::Paid);

    // Balance is now 200,000 - 1,000,000 = -800,000
    expect(LedgerEntry::getBalance($this->fund->id))->toBe(-800000);
});

it('allows fund transfer to result in negative balance when allow_negative_balance is true', function () {
    $this->setting->update([
        'allow_negative_balance' => true,
    ]);

    $requester = actingAsRole(Role::Penghitung);

    $transfer = FundTransfer::create([
        'from_fund_id' => $this->fund->id, // balance 200,000
        'to_fund_id' => $this->otherFund->id,
        'account_id' => $this->account->id,
        'amount' => 700000, // 700,000 > 200,000
        'transfer_date' => '2026-10-21',
        'reason' => 'Talangan dana kegiatan',
        'status' => FundTransferStatus::Pending,
        'requested_by' => $requester->id,
    ]);

    actingAsRole(Role::Bendahara);
    $this->post(route('transfers.approve', $transfer->id))->assertRedirect();

    $transfer->refresh();
    expect($transfer->status)->toBe(FundTransferStatus::Approved);

    // Source fund balance: 200,000 - 700,000 = -500,000
    expect(LedgerEntry::getBalance($this->fund->id))->toBe(-500000);
    // Destination fund balance: 700,000
    expect(LedgerEntry::getBalance($this->otherFund->id))->toBe(700000);
});
