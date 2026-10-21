<?php

use App\Enums\AccountType;
use App\Enums\Direction;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Fund;
use App\Models\FundTransfer;
use App\Models\LedgerEntry;
use App\Services\FinancialReportService;
use App\Services\LedgerService;
use Carbon\Carbon;

beforeEach(function () {
    ChurchSetting::current();
});

it('resolves date ranges for all periodic report types', function () {
    $service = new FinancialReportService();

    // Harian
    $harian = $service->resolvePeriod('harian', date: '2026-10-15');
    expect($harian['start_date'])->toBe('2026-10-15')
        ->and($harian['end_date'])->toBe('2026-10-15');

    // Mingguan
    $mingguan = $service->resolvePeriod('mingguan', date: '2026-10-14'); // Wednesday
    expect($mingguan['start_date'])->toBe('2026-10-12') // Monday
        ->and($mingguan['end_date'])->toBe('2026-10-18'); // Sunday

    // Bulanan
    $bulanan = $service->resolvePeriod('bulanan', year: 2026, month: 10);
    expect($bulanan['start_date'])->toBe('2026-10-01')
        ->and($bulanan['end_date'])->toBe('2026-10-31');

    // Triwulan (Q3 = Jul - Sep)
    $triwulan = $service->resolvePeriod('triwulan', year: 2026, quarter: 3);
    expect($triwulan['start_date'])->toBe('2026-07-01')
        ->and($triwulan['end_date'])->toBe('2026-09-30');

    // Semester (S2 = Jul - Dec)
    $semester = $service->resolvePeriod('semester', year: 2026, semester: 2);
    expect($semester['start_date'])->toBe('2026-07-01')
        ->and($semester['end_date'])->toBe('2026-12-31');

    // Tahunan
    $tahunan = $service->resolvePeriod('tahunan', year: 2026);
    expect($tahunan['start_date'])->toBe('2026-01-01')
        ->and($tahunan['end_date'])->toBe('2026-12-31');

    // Custom
    $custom = $service->resolvePeriod('custom', from: '2026-05-10', to: '2026-06-20');
    expect($custom['start_date'])->toBe('2026-05-10')
        ->and($custom['end_date'])->toBe('2026-06-20');
});

it('calculates accurate opening balances, income, expense, transfers, and closing balances', function () {
    $service = new FinancialReportService();

    // Accounts
    $kasKecil = Account::create(['code' => 'KAS-KCL', 'name' => 'Kas Kecil', 'type' => AccountType::Cash, 'is_active' => true]);
    $bankBca = Account::create(['code' => 'BCA-OPS', 'name' => 'Bank BCA', 'type' => AccountType::Bank, 'bank_name' => 'BCA', 'account_number' => '12345678', 'is_active' => true]);

    // Funds
    $danaUmum = Fund::create(['code' => 'UMUM', 'name' => 'Dana Operasional Umum', 'is_active' => true]);
    $danaPembangunan = Fund::create(['code' => 'BG', 'name' => 'Dana Pembangunan', 'is_active' => true]);

    // Categories
    $katPersembahan = Category::create(['name' => 'Persembahan Ibadah', 'direction' => Direction::In, 'default_fund_id' => $danaUmum->id, 'is_active' => true]);
    $katPersepuluhan = Category::create(['name' => 'Persepuluhan', 'direction' => Direction::In, 'default_fund_id' => $danaPembangunan->id, 'is_active' => true]);
    $katOperasional = Category::create(['name' => 'Listrik & Air', 'direction' => Direction::Out, 'default_fund_id' => $danaUmum->id, 'is_active' => true]);

    // 1. Transaction BEFORE period (September 2026) -> contributes to Saldo Awal October 2026
    LedgerService::record([
        'entry_date' => '2026-09-15',
        'account_id' => $kasKecil->id,
        'fund_id' => $danaUmum->id,
        'category_id' => $katPersembahan->id,
        'amount' => 5_000_000,
        'direction' => Direction::In,
        'description' => 'Saldo awal bulan lalu',
    ]);
    LedgerService::record([
        'entry_date' => '2026-09-20',
        'account_id' => $bankBca->id,
        'fund_id' => $danaPembangunan->id,
        'category_id' => $katPersepuluhan->id,
        'amount' => 10_000_000,
        'direction' => Direction::In,
        'description' => 'Persembahan pembangunan bulan lalu',
    ]);

    // 2. Transactions INSIDE period (October 2026)
    // Income
    LedgerService::record([
        'entry_date' => '2026-10-04',
        'account_id' => $kasKecil->id,
        'fund_id' => $danaUmum->id,
        'category_id' => $katPersembahan->id,
        'amount' => 2_500_000,
        'direction' => Direction::In,
        'description' => 'Persembahan Minggu 1',
    ]);
    LedgerService::record([
        'entry_date' => '2026-10-11',
        'account_id' => $bankBca->id,
        'fund_id' => $danaPembangunan->id,
        'category_id' => $katPersepuluhan->id,
        'amount' => 4_000_000,
        'direction' => Direction::In,
        'description' => 'Persepuluhan transfer',
    ]);

    // Expense
    LedgerService::record([
        'entry_date' => '2026-10-12',
        'account_id' => $kasKecil->id,
        'fund_id' => $danaUmum->id,
        'category_id' => $katOperasional->id,
        'amount' => 1_200_000,
        'direction' => Direction::Out,
        'description' => 'Bayar PLN',
    ]);

    // Fund Transfer (Umum -> Pembangunan 1,000,000)
    LedgerService::record([
        'entry_date' => '2026-10-15',
        'account_id' => $kasKecil->id,
        'fund_id' => $danaUmum->id,
        'amount' => 1_000_000,
        'direction' => Direction::Out,
        'description' => 'Transfer kas ke dana pembangunan',
        'source_type' => 'fund_transfer',
        'source_id' => 1,
    ]);
    LedgerService::record([
        'entry_date' => '2026-10-15',
        'account_id' => $kasKecil->id,
        'fund_id' => $danaPembangunan->id,
        'amount' => 1_000_000,
        'direction' => Direction::In,
        'description' => 'Penerimaan transfer dari dana umum',
        'source_type' => 'fund_transfer',
        'source_id' => 1,
    ]);

    // Generate report for October 2026
    $report = $service->generate('2026-10-01', '2026-10-31');

    // Verify Saldo Awal
    expect($report['opening_balances']['total'])->toBe(15_000_000);
    $awalUmum = collect($report['opening_balances']['by_fund'])->firstWhere('fund_id', $danaUmum->id);
    expect($awalUmum['balance'])->toBe(5_000_000);
    $awalPembangunan = collect($report['opening_balances']['by_fund'])->firstWhere('fund_id', $danaPembangunan->id);
    expect($awalPembangunan['balance'])->toBe(10_000_000);

    // Saldo Awal by Account
    $awalKasKecil = collect($report['opening_balances']['by_account'])->firstWhere('account_id', $kasKecil->id);
    expect($awalKasKecil['balance'])->toBe(5_000_000);
    $awalBankBca = collect($report['opening_balances']['by_account'])->firstWhere('account_id', $bankBca->id);
    expect($awalBankBca['balance'])->toBe(10_000_000);

    // Verify Incomes (2,500,000 + 4,000,000 = 6,500,000)
    expect($report['incomes']['total'])->toBe(6_500_000);
    $incPersembahan = collect($report['incomes']['by_category'])->firstWhere('category_id', $katPersembahan->id);
    expect($incPersembahan['total'])->toBe(2_500_000);
    $incPersepuluhan = collect($report['incomes']['by_category'])->firstWhere('category_id', $katPersepuluhan->id);
    expect($incPersepuluhan['total'])->toBe(4_000_000);

    // Verify Expenses (1,200,000)
    expect($report['expenses']['total'])->toBe(1_200_000);
    $expOperasional = collect($report['expenses']['by_category'])->firstWhere('category_id', $katOperasional->id);
    expect($expOperasional['total'])->toBe(1_200_000);

    // Verify Transfers
    $tfUmum = collect($report['transfers']['by_fund'])->firstWhere('fund_id', $danaUmum->id);
    expect($tfUmum['net_transfer'])->toBe(-1_000_000);
    $tfPembangunan = collect($report['transfers']['by_fund'])->firstWhere('fund_id', $danaPembangunan->id);
    expect($tfPembangunan['net_transfer'])->toBe(1_000_000);

    // Verify Saldo Akhir
    // Dana Umum: 5,000,000 + 2,500,000 (in) - 1,200,000 (out) - 1,000,000 (tf out) = 5,300,000
    // Dana Pembangunan: 10,000,000 + 4,000,000 (in) + 1,000,000 (tf in) = 15,000,000
    // Total Saldo Akhir: 5,300,000 + 15,000,000 = 20,300,000
    // (Total Saldo Awal: 15,000,000 + Total In: 6,500,000 - Total Out: 1,200,000 = 20,300,000)
    expect($report['closing_balances']['total'])->toBe(20_300_000);

    $akhirUmum = collect($report['closing_balances']['by_fund'])->firstWhere('fund_id', $danaUmum->id);
    expect($akhirUmum['closing_balance'])->toBe(5_300_000);

    $akhirPembangunan = collect($report['closing_balances']['by_fund'])->firstWhere('fund_id', $danaPembangunan->id);
    expect($akhirPembangunan['closing_balance'])->toBe(15_000_000);

    // Verify Accounts sum equals Funds sum
    $totalAccountsAkhir = collect($report['closing_balances']['by_account'])->sum('closing_balance');
    $totalFundsAkhir = collect($report['closing_balances']['by_fund'])->sum('closing_balance');
    expect($totalAccountsAkhir)->toBe(20_300_000)
        ->and($totalFundsAkhir)->toBe(20_300_000);
});

it('strictly maintains the invariant: Saldo Akhir Period T === Saldo Awal Period T+1', function () {
    $service = new FinancialReportService();

    $kas = Account::create(['code' => 'KAS-INV', 'name' => 'Kas Induk', 'type' => AccountType::Cash, 'is_active' => true]);
    $fund = Fund::create(['code' => 'F-INV', 'name' => 'Dana Invariant', 'is_active' => true]);
    $catIn = Category::create(['name' => 'Pemasukan Inv', 'direction' => Direction::In, 'default_fund_id' => $fund->id, 'is_active' => true]);
    $catOut = Category::create(['name' => 'Pengeluaran Inv', 'direction' => Direction::Out, 'default_fund_id' => $fund->id, 'is_active' => true]);

    // Entries in Period T (October 2026)
    LedgerService::record([
        'entry_date' => '2026-10-05',
        'account_id' => $kas->id,
        'fund_id' => $fund->id,
        'category_id' => $catIn->id,
        'amount' => 7_500_000,
        'direction' => Direction::In,
        'description' => 'Persembahan Oktober',
    ]);
    LedgerService::record([
        'entry_date' => '2026-10-31',
        'account_id' => $kas->id,
        'fund_id' => $fund->id,
        'category_id' => $catOut->id,
        'amount' => 2_350_000,
        'direction' => Direction::Out,
        'description' => 'Biaya akhir Oktober',
    ]);

    // Period T: 2026-10-01 to 2026-10-31
    $reportT = $service->generate('2026-10-01', '2026-10-31');

    // Period T+1: 2026-11-01 to 2026-11-30
    $reportTPlus1 = $service->generate('2026-11-01', '2026-11-30');

    // Strict equality invariant:
    expect($reportT['closing_balances']['total'])->toBe($reportTPlus1['opening_balances']['total'])
        ->and($reportT['closing_balances']['total'])->toBe(5_150_000);

    $fundClosingT = collect($reportT['closing_balances']['by_fund'])->firstWhere('fund_id', $fund->id)['closing_balance'];
    $fundOpeningTPlus1 = collect($reportTPlus1['opening_balances']['by_fund'])->firstWhere('fund_id', $fund->id)['balance'];
    expect($fundClosingT)->toBe($fundOpeningTPlus1);

    $accountClosingT = collect($reportT['closing_balances']['by_account'])->firstWhere('account_id', $kas->id)['closing_balance'];
    $accountOpeningTPlus1 = collect($reportTPlus1['opening_balances']['by_account'])->firstWhere('account_id', $kas->id)['balance'];
    expect($accountClosingT)->toBe($accountOpeningTPlus1);
});

it('handles reversals correctly in net category calculations', function () {
    $service = new FinancialReportService();

    $kas = Account::create(['code' => 'KAS-REV', 'name' => 'Kas', 'type' => AccountType::Cash, 'is_active' => true]);
    $fund = Fund::create(['code' => 'F-REV', 'name' => 'Dana', 'is_active' => true]);
    $catIn = Category::create(['name' => 'Kolekte', 'direction' => Direction::In, 'default_fund_id' => $fund->id, 'is_active' => true]);

    $original = LedgerService::record([
        'entry_date' => '2026-10-10',
        'account_id' => $kas->id,
        'fund_id' => $fund->id,
        'category_id' => $catIn->id,
        'amount' => 1_000_000,
        'direction' => Direction::In,
        'description' => 'Salah catat kolekte',
    ]);

    // Reverse 1,000,000
    LedgerService::reverse($original, 'Koreksi salah nominal');

    // Record correct 700,000
    LedgerService::record([
        'entry_date' => '2026-10-10',
        'account_id' => $kas->id,
        'fund_id' => $fund->id,
        'category_id' => $catIn->id,
        'amount' => 700_000,
        'direction' => Direction::In,
        'description' => 'Kolekte yang benar',
    ]);

    $report = $service->generate('2026-10-01', '2026-10-31');

    // Net income should be 700,000 (1,000,000 in - 1,000,000 out + 700,000 in)
    expect($report['incomes']['total'])->toBe(700_000);
    $kolekte = collect($report['incomes']['by_category'])->firstWhere('category_id', $catIn->id);
    expect($kolekte['total'])->toBe(700_000);
});

it('accurately reflects bank deposits in account balances without affecting fund balances', function () {
    $service = new FinancialReportService();

    $kas = Account::create(['code' => 'KAS-DEP', 'name' => 'Kas Tunai', 'type' => AccountType::Cash, 'is_active' => true]);
    $bank = Account::create(['code' => 'BNK-DEP', 'name' => 'Bank Mandiri', 'type' => AccountType::Bank, 'is_active' => true]);
    $fund = Fund::create(['code' => 'F-DEP', 'name' => 'Dana Tetap', 'is_active' => true]);
    $cat = Category::create(['name' => 'Persembahan', 'direction' => Direction::In, 'default_fund_id' => $fund->id, 'is_active' => true]);

    // Receive 5,000,000 cash
    LedgerService::record([
        'entry_date' => '2026-10-02',
        'account_id' => $kas->id,
        'fund_id' => $fund->id,
        'category_id' => $cat->id,
        'amount' => 5_000_000,
        'direction' => Direction::In,
        'description' => 'Terima persembahan tunai',
    ]);

    // Deposit 3,000,000 to bank (bank deposit)
    LedgerService::record([
        'entry_date' => '2026-10-05',
        'account_id' => $kas->id,
        'fund_id' => $fund->id,
        'amount' => 3_000_000,
        'direction' => Direction::Out,
        'description' => 'Setor ke Bank',
        'source_type' => 'bank_deposit',
        'source_id' => 99,
    ]);
    LedgerService::record([
        'entry_date' => '2026-10-05',
        'account_id' => $bank->id,
        'fund_id' => $fund->id,
        'amount' => 3_000_000,
        'direction' => Direction::In,
        'description' => 'Terima setoran dari Kas',
        'source_type' => 'bank_deposit',
        'source_id' => 99,
    ]);

    $report = $service->generate('2026-10-01', '2026-10-31');

    // Fund closing balance should remain 5,000,000
    $fundBal = collect($report['closing_balances']['by_fund'])->firstWhere('fund_id', $fund->id);
    expect($fundBal['closing_balance'])->toBe(5_000_000);

    // Kas closing balance: 2,000,000
    $kasBal = collect($report['closing_balances']['by_account'])->firstWhere('account_id', $kas->id);
    expect($kasBal['closing_balance'])->toBe(2_000_000);

    // Bank closing balance: 3,000,000
    $bankBal = collect($report['closing_balances']['by_account'])->firstWhere('account_id', $bank->id);
    expect($bankBal['closing_balance'])->toBe(3_000_000);

    // Total closing balance = 5,000,000
    expect($report['closing_balances']['total'])->toBe(5_000_000);
});
