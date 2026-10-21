<?php

namespace Tests\Feature;

use App\Enums\AccountType;
use App\Enums\Direction;
use App\Enums\ExpenseStatus;
use App\Enums\FundTransferStatus;
use App\Enums\Role;
use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\BankDeposit;
use App\Models\Category;
use App\Models\Event;
use App\Models\Expense;
use App\Models\FrozenReport;
use App\Models\Fund;
use App\Models\FundTransfer;
use App\Models\LedgerEntry;
use App\Models\ReportApproval;
use App\Models\User;
use App\Services\ExpenseService;
use App\Services\LedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\TestCase;

class SecurityAndIntegrityFixesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function createFund(string $code = 'UMUM', string $name = 'Dana Umum'): Fund
    {
        return Fund::create([
            'code' => $code,
            'name' => $name,
            'type' => 'unrestricted',
            'is_active' => true,
        ]);
    }

    private function createAccount(string $code = '1101', string $name = 'Kas Tunai', AccountType $type = AccountType::Cash): Account
    {
        return Account::create([
            'code' => $code,
            'name' => $name,
            'type' => $type,
            'is_active' => true,
        ]);
    }

    private function createCategory(?int $fundId = null, string $code = 'KAT-01', string $name = 'Kolekte Umum'): Category
    {
        return Category::create([
            'code' => $code,
            'name' => $name,
            'direction' => Direction::In,
            'default_fund_id' => $fundId ?? Fund::first()->id,
            'is_active' => true,
            'is_public' => true,
        ]);
    }

    public function test_allocation_rule_rejects_sum_not_exactly_100_percent(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::Admin->value);
        $fund1 = $this->createFund('F1', 'Dana 1');
        $fund2 = $this->createFund('F2', 'Dana 2');
        $category = $this->createCategory($fund1->id);

        // 99.99%
        $response = $this->actingAs($admin)->post(route('admin.allocations.store'), [
            'category_id' => $category->id,
            'name' => 'Aturan Kurang',
            'valid_from' => '2026-01-01',
            'items' => [
                ['fund_id' => $fund1->id, 'percentage' => 50.00],
                ['fund_id' => $fund2->id, 'percentage' => 49.99],
            ],
        ]);
        $response->assertSessionHasErrors('items');

        // 100.01%
        $response2 = $this->actingAs($admin)->post(route('admin.allocations.store'), [
            'category_id' => $category->id,
            'name' => 'Aturan Lebih',
            'valid_from' => '2026-01-01',
            'items' => [
                ['fund_id' => $fund1->id, 'percentage' => 50.00],
                ['fund_id' => $fund2->id, 'percentage' => 50.01],
            ],
        ]);
        $response2->assertSessionHasErrors('items');

        // Exactly 100.00%
        $response3 = $this->actingAs($admin)->post(route('admin.allocations.store'), [
            'category_id' => $category->id,
            'name' => 'Aturan Pas',
            'valid_from' => '2026-01-01',
            'items' => [
                ['fund_id' => $fund1->id, 'percentage' => 50.00],
                ['fund_id' => $fund2->id, 'percentage' => 50.00],
            ],
        ]);
        $response3->assertSessionHasNoErrors();
    }

    public function test_ledger_entry_cannot_be_reversed_multiple_times(): void
    {
        $fund = $this->createFund();
        $account = $this->createAccount();

        $entry = LedgerService::record([
            'entry_date' => '2026-03-01',
            'account_id' => $account->id,
            'fund_id' => $fund->id,
            'amount' => 500_000,
            'direction' => Direction::In,
            'description' => 'Test Record',
        ]);

        $reversal = LedgerService::reverse($entry, 'Kesalahan input');
        $this->assertNotNull($reversal);

        // Second reversal on original must throw LogicException
        $this->expectException(LogicException::class);
        LedgerService::reverse($entry, 'Pembalik kedua');
    }

    public function test_reversal_entry_cannot_be_reversed(): void
    {
        $fund = $this->createFund();
        $account = $this->createAccount();

        $entry = LedgerService::record([
            'entry_date' => '2026-03-01',
            'account_id' => $account->id,
            'fund_id' => $fund->id,
            'amount' => 500_000,
            'direction' => Direction::In,
            'description' => 'Test Record',
        ]);

        $reversal = LedgerService::reverse($entry, 'Kesalahan input');

        $this->expectException(LogicException::class);
        LedgerService::reverse($reversal, 'Membalikkan entri pembalik');
    }

    public function test_subsequent_accounting_period_rejects_opening_balances(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::Admin->value);
        $account = $this->createAccount();
        $fund = $this->createFund();

        // First period
        AccountingPeriod::create([
            'name' => 'Periode 2025',
            'start_date' => '2025-01-01',
            'end_date' => '2025-12-31',
        ]);

        // Second period attempt with opening balances should be rejected
        $response = $this->actingAs($admin)->post(route('admin.periods.store'), [
            'name' => 'Periode 2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'opening_balances' => [
                [
                    'account_id' => $account->id,
                    'fund_id' => $fund->id,
                    'amount' => 10_000_000,
                ],
            ],
        ]);

        $response->assertSessionHasErrors('opening_balances');
    }

    public function test_expense_payment_fails_if_account_has_insufficient_balance(): void
    {
        $bendahara = User::factory()->create();
        $bendahara->assignRole(Role::Bendahara->value);

        $fund = $this->createFund();
        $cashAccount = $this->createAccount('1101', 'Kas Tunai', AccountType::Cash);
        $bankAccount = $this->createAccount('1102', 'Bank BCA', AccountType::Bank);
        $category = $this->createCategory($fund->id);

        // Ensure fund has plenty of balance in bankAccount, but cashAccount has 0 balance
        LedgerService::record([
            'entry_date' => '2026-03-01',
            'account_id' => $bankAccount->id,
            'fund_id' => $fund->id,
            'amount' => 50_000_000,
            'direction' => Direction::In,
            'description' => 'Topup in bank account',
        ]);

        $expense = Expense::create([
            'expense_number' => 'EXP-202603-0001',
            'payee' => 'Toko Alat Musik',
            'amount' => 2_000_000,
            'date' => '2026-03-02',
            'account_id' => $cashAccount->id, // 0 balance in this cash account
            'fund_id' => $fund->id,
            'category_id' => $category->id,
            'status' => ExpenseStatus::Approved,
            'submitted_by' => $bendahara->id,
            'proof_path' => 'expenses/test.png',
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        app(ExpenseService::class)->pay($expense, $bendahara);
    }

    public function test_bank_deposit_requires_sufficient_source_account_balance(): void
    {
        $bendahara = User::factory()->create();
        $bendahara->assignRole(Role::Bendahara->value);

        $fund = $this->createFund('UMUM', 'Dana Umum');
        $cash = $this->createAccount('1101', 'Kas Tunai', AccountType::Cash);
        $bank = $this->createAccount('1102', 'Bank BCA', AccountType::Bank);

        // cash has 0 balance, try depositing 1,000,000
        $response = $this->actingAs($bendahara)->post(route('deposits.store'), [
            'deposit_date' => '2026-03-02',
            'from_account_id' => $cash->id,
            'to_account_id' => $bank->id,
            'amount' => 1_000_000,
        ]);

        $response->assertSessionHasErrors(['amount']);
    }

    public function test_bank_deposit_is_idempotent(): void
    {
        $bendahara = User::factory()->create();
        $bendahara->assignRole(Role::Bendahara->value);

        $cash = $this->createAccount('1101', 'Kas Tunai', AccountType::Cash);
        $bank = $this->createAccount('1102', 'Bank BCA', AccountType::Bank);
        $fund = $this->createFund();

        // Topup cash
        LedgerService::record([
            'entry_date' => '2026-03-01',
            'account_id' => $cash->id,
            'fund_id' => $fund->id,
            'amount' => 5_000_000,
            'direction' => Direction::In,
            'description' => 'Initial cash balance',
        ]);

        $idemKey = 'deposit-unique-test-key-123';

        // First submit
        $response1 = $this->actingAs($bendahara)->post(route('deposits.store'), [
            'deposit_date' => '2026-03-02',
            'from_account_id' => $cash->id,
            'to_account_id' => $bank->id,
            'amount' => 1_000_000,
            'idempotency_key' => $idemKey,
        ]);
        $response1->assertRedirect(route('deposits.index'));

        $this->assertDatabaseCount('bank_deposits', 1);

        // Duplicate submit with same idempotency key
        $response2 = $this->actingAs($bendahara)->post(route('deposits.store'), [
            'deposit_date' => '2026-03-02',
            'from_account_id' => $cash->id,
            'to_account_id' => $bank->id,
            'amount' => 1_000_000,
            'idempotency_key' => $idemKey,
        ]);
        $response2->assertRedirect(route('deposits.index'));

        // Still only 1 deposit and no duplicate ledger entries
        $this->assertDatabaseCount('bank_deposits', 1);
        $this->assertEquals(4_000_000, LedgerEntry::getAccountBalance($cash->id));
        $this->assertEquals(1_000_000, LedgerEntry::getAccountBalance($bank->id));
    }

    public function test_regular_member_cannot_access_or_mutate_events(): void
    {
        $jemaat = User::factory()->create();
        $jemaat->assignRole(Role::Jemaat->value);

        $eventFund = $this->createFund('EVT-01', 'Dana Paskah');
        $event = Event::create([
            'name' => 'Paskah 2026',
            'slug' => 'paskah-2026',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-05',
            'budget' => 10_000_000,
            'fund_id' => $eventFund->id,
        ]);

        // Member cannot view event create form
        $this->actingAs($jemaat)->get(route('events.create'))->assertForbidden();

        // Member cannot post new event
        $this->actingAs($jemaat)->post(route('events.store'), [
            'name' => 'Acara Ilegal',
            'start_date' => '2026-05-01',
            'budget' => 5_000_000,
        ])->assertForbidden();

        // Member cannot close or delete event
        $this->actingAs($jemaat)->post(route('events.close', $event))->assertForbidden();
        $this->actingAs($jemaat)->delete(route('events.destroy', $event))->assertForbidden();
    }

    public function test_regular_member_cannot_access_general_donations_endpoint(): void
    {
        $jemaat = User::factory()->create();
        $jemaat->assignRole(Role::Jemaat->value);

        // General donations endpoint should be restricted to bendahara/penghitung/admin
        $this->actingAs($jemaat)->get(route('donations.index'))->assertForbidden();
    }

    public function test_regular_member_cannot_access_deposits_endpoint(): void
    {
        $jemaat = User::factory()->create();
        $jemaat->assignRole(Role::Jemaat->value);

        $this->actingAs($jemaat)->get(route('deposits.index'))->assertForbidden();
    }

    public function test_report_approval_rejects_cross_report_approval_id(): void
    {
        $admin = User::factory()->create(['signature_path' => 'signatures/admin.png']);
        $admin->assignRole(Role::Admin->value);
        \Illuminate\Support\Facades\Storage::disk('local')->put('signatures/admin.png', 'fake signature');

        $period = AccountingPeriod::create([
            'name' => 'Q1 2026',
            'start_date' => '2026-01-01',
            'end_date' => '2026-03-31',
        ]);

        $reportA = FrozenReport::create([
            'title' => 'Laporan Kas Q1 A',
            'period_type' => 'triwulan',
            'start_date' => '2026-01-01',
            'end_date' => '2026-03-31',
            'verification_code' => 'ABC12345',
            'status' => FrozenReport::STATUS_PENDING,
            'data_snapshot' => ['cash' => 100],
            'created_by' => $admin->id,
        ]);

        $reportB = FrozenReport::create([
            'title' => 'Laporan Kas Q1 B',
            'period_type' => 'triwulan',
            'start_date' => '2026-01-01',
            'end_date' => '2026-03-31',
            'verification_code' => 'XYZ98765',
            'status' => FrozenReport::STATUS_PENDING,
            'data_snapshot' => ['cash' => 200],
            'created_by' => $admin->id,
        ]);

        $approvalA = ReportApproval::create([
            'frozen_report_id' => $reportA->id,
            'role' => Role::Admin->value,
            'status' => ReportApproval::STATUS_PENDING,
            'order' => 1,
            'signatory_title' => 'Mengetahui',
            'signatory_position' => 'Ketua Majelis',
        ]);

        // Attempt to approve approvalA via reportB route
        $response = $this->actingAs($admin)->post(
            route('reports.approve', ['report' => $reportB->id, 'approval' => $approvalA->id])
        );

        // Must fail with 404
        $response->assertStatus(404);
    }
}
