<?php

use App\Enums\Direction;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Donation;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\Member;
use App\Models\User;
use App\Services\LedgerService;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->setting = ChurchSetting::current();
    $this->setting->update([
        'name' => 'Gereja Bethel Indonesia Jemaat Kasih',
        'public_page_enabled' => true,
    ]);

    $this->account = Account::create([
        'code' => 'KAS-PUB',
        'name' => 'Kas Operasional',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM-PUB',
        'name' => 'Dana Umum',
        'is_active' => true,
    ]);
});

it('can be accessed by public guests without login when public_page_enabled is true', function () {
    $response = $this->get(route('transparency.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('transparency/index')
        ->where('churchName', 'Gereja Bethel Indonesia Jemaat Kasih')
    );
});

it('returns 404 not found when public_page_enabled is false', function () {
    $this->setting->update(['public_page_enabled' => false]);

    $response = $this->get(route('transparency.index'));
    $response->assertNotFound();
});

it('aggregates income and expenses only for categories where is_public is true', function () {
    $publicIncomeCat = Category::create([
        'name' => 'Kolekte Ibadah Raya',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'is_public' => true,
        'is_active' => true,
    ]);

    $secretIncomeCat = Category::create([
        'name' => 'Sumbangan Khusus Tertutup',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'is_public' => false,
        'is_active' => true,
    ]);

    $publicExpenseCat = Category::create([
        'name' => 'Bantuan Diakonia Jemaat',
        'direction' => Direction::Out,
        'default_fund_id' => $this->fund->id,
        'is_public' => true,
        'is_active' => true,
    ]);

    $internalExpenseCat = Category::create([
        'name' => 'Operasional Rahasia Pengurus',
        'direction' => Direction::Out,
        'default_fund_id' => $this->fund->id,
        'is_public' => false,
        'is_active' => true,
    ]);

    // Record ledger entries
    LedgerService::record([
        'entry_date' => '2026-10-10',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $publicIncomeCat->id,
        'amount' => 5000000,
        'direction' => Direction::In,
        'description' => 'Kolekte Umum Minggu',
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-11',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $secretIncomeCat->id,
        'amount' => 3000000,
        'direction' => Direction::In,
        'description' => 'Sumbangan Rahasia Donatur',
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-12',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $publicExpenseCat->id,
        'amount' => 2000000,
        'direction' => Direction::Out,
        'description' => 'Diakonia Beras',
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-13',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $internalExpenseCat->id,
        'amount' => 1000000,
        'direction' => Direction::Out,
        'description' => 'Operasional Rahasia',
    ]);

    $response = $this->get(route('transparency.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('transparency/index')
        ->has('incomeByCategory', 1, fn (Assert $item) => $item
            ->where('name', 'Kolekte Ibadah Raya')
            ->where('amount', 5000000)
            ->etc()
        )
        ->has('expenseByCategory', 1, fn (Assert $item) => $item
            ->where('name', 'Bantuan Diakonia Jemaat')
            ->where('amount', 2000000)
            ->etc()
        )
        ->where('summary.totalIncome', 5000000)
        ->where('summary.totalExpense', 2000000)
    );
});

it('strictly sanitizes and never exposes donor names, payees, member details, or individual amounts', function () {
    $member = Member::create([
        'member_number' => 'MEM-CONFIDENTIAL-01',
        'name' => 'Bapak Yohanes Pembaptis Rahasia',
        'phone' => '081299998888',
        'email' => 'yohanes@secret.test',
        'is_active' => true,
    ]);

    $cat = Category::create([
        'name' => 'Persembahan Perpuluhan',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'is_public' => true,
        'is_active' => true,
    ]);

    Donation::create([
        'member_id' => $member->id,
        'donor_name' => 'Bapak Yohanes Pembaptis Rahasia',
        'category_id' => $cat->id,
        'amount' => 7777777,
        'receipt_number' => 'RCP-SECRET-001',
        'notes' => 'Catatan pribadi sumbangan keluarga Bapak Yohanes',
    ]);

    Expense::create([
        'expense_number' => 'EXP-SECRET-999',
        'payee' => 'Toko Bangunan CV Rahasia Jaya',
        'amount' => 8888888,
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $cat->id,
        'proof_path' => 'expenses/secret.jpg',
        'submitted_by' => User::factory()->create()->id,
        'description' => 'Pembelian semen rahasia tanpa publikasi',
    ]);

    $response = $this->get(route('transparency.index'));

    $response->assertOk();

    // Verify none of the confidential strings leak into the HTML / JSON response body
    $content = $response->getContent();
    expect($content)->not->toContain('Yohanes Pembaptis Rahasia')
        ->and($content)->not->toContain('MEM-CONFIDENTIAL-01')
        ->and($content)->not->toContain('081299998888')
        ->and($content)->not->toContain('yohanes@secret.test')
        ->and($content)->not->toContain('Catatan pribadi sumbangan keluarga')
        ->and($content)->not->toContain('Toko Bangunan CV Rahasia Jaya')
        ->and($content)->not->toContain('Pembelian semen rahasia tanpa publikasi')
        ->and($content)->not->toContain('7777777')
        ->and($content)->not->toContain('8888888')
        ->and($content)->not->toContain('RCP-SECRET-001')
        ->and($content)->not->toContain('EXP-SECRET-999');
});
