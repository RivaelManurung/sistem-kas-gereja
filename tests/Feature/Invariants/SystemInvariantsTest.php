<?php

use App\Enums\Direction;
use App\Enums\Role;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Donation;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\Member;
use App\Models\User;
use App\Services\LedgerService;

beforeEach(function () {
    $this->setting = ChurchSetting::current();
    $this->setting->update([
        'name' => 'Gereja Kristen Indonesia',
        'public_page_enabled' => true,
    ]);

    $this->account = Account::create([
        'code' => 'KAS-INV',
        'name' => 'Kas Invarian',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $this->fund = Fund::create([
        'code' => 'UMUM-INV',
        'name' => 'Dana Umum Invarian',
        'is_active' => true,
    ]);
});

/*
|--------------------------------------------------------------------------
| Invariant 1: Append-Only Ledger Integrity (Spec §7 & §11)
|--------------------------------------------------------------------------
*/

it('enforces append-only invariant preventing update on ledger entries', function () {
    $entry = LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 1500000,
        'direction' => Direction::In,
        'description' => 'Entri Awal Kas',
    ]);

    expect(fn () => $entry->update(['amount' => 9999999]))
        ->toThrow(\LogicException::class, 'ledger_entries is append-only');

    expect($entry->fresh()->amount)->toBe(1500000);
});

it('enforces append-only invariant preventing delete on ledger entries', function () {
    $entry = LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 2000000,
        'direction' => Direction::In,
        'description' => 'Entri Tetap Kas',
    ]);

    expect(fn () => $entry->delete())
        ->toThrow(\LogicException::class, 'ledger_entries is append-only');

    expect(LedgerEntry::where('id', $entry->id)->exists())->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| Invariant 2: Transparency Data Privacy Sanitization (Spec §10 & §11)
|--------------------------------------------------------------------------
*/

it('strictly protects privacy and excludes any personal identifiable data from transparency endpoint', function () {
    $publicCat = Category::create([
        'name' => 'Persembahan Ibadah Umum',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'is_public' => true,
        'is_active' => true,
    ]);

    $privateCat = Category::create([
        'name' => 'Bantuan Khusus Tertutup',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'is_public' => false,
        'is_active' => true,
    ]);

    // Member with sensitive personal info
    $member = Member::create([
        'member_number' => 'MEM-INV-9999',
        'name' => 'Ibu Ruth Simanjuntak Rahasia',
        'phone' => '081298765432',
        'email' => 'ruth.simanjuntak@pribadi.test',
        'address' => 'Jl. Mawar Indah Blok B1 No. 5',
        'is_active' => true,
    ]);

    // Named donation
    Donation::create([
        'member_id' => $member->id,
        'donor_name' => 'Ibu Ruth Simanjuntak Rahasia',
        'category_id' => $publicCat->id,
        'amount' => 2500000,
        'receipt_number' => 'RCP-INV-PRIVACY-001',
        'notes' => 'Catatan pribadi sumbangan keluarga Ibu Ruth',
    ]);

    // Expense with vendor and internal description
    Expense::create([
        'expense_number' => 'EXP-INV-PRIVACY-002',
        'payee' => 'CV Berkat Abadi Konstruksi Rahasia',
        'amount' => 4500000,
        'date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $publicCat->id,
        'proof_path' => 'expenses/nota-rahasia.jpg',
        'submitted_by' => User::factory()->create()->id,
        'description' => 'Pembayaran rahasia renovasi ruang pastoral',
    ]);

    // Public transaction on public category
    LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $publicCat->id,
        'amount' => 6000000,
        'direction' => Direction::In,
        'description' => 'Pemasukan Publik Bersih',
    ]);

    // Private transaction on private category
    LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'category_id' => $privateCat->id,
        'amount' => 1234567,
        'direction' => Direction::In,
        'description' => 'Pemasukan Tertutup Gembala',
    ]);

    $response = $this->get(route('transparency.index'));
    $response->assertOk();

    $content = $response->getContent();

    // Verify ZERO personal and internal identifiers leaked
    expect($content)->not->toContain('Ruth Simanjuntak')
        ->and($content)->not->toContain('MEM-INV-9999')
        ->and($content)->not->toContain('081298765432')
        ->and($content)->not->toContain('ruth.simanjuntak@pribadi.test')
        ->and($content)->not->toContain('Jl. Mawar Indah')
        ->and($content)->not->toContain('Catatan pribadi sumbangan keluarga')
        ->and($content)->not->toContain('CV Berkat Abadi Konstruksi Rahasia')
        ->and($content)->not->toContain('Pembayaran rahasia renovasi ruang pastoral')
        ->and($content)->not->toContain('RCP-INV-PRIVACY-001')
        ->and($content)->not->toContain('EXP-INV-PRIVACY-002')
        ->and($content)->not->toContain('2500000')
        ->and($content)->not->toContain('4500000')
        ->and($content)->not->toContain('1234567')
        ->and($content)->not->toContain('Bantuan Khusus Tertutup'); // Non-public category omitted
});

/*
|--------------------------------------------------------------------------
| Invariant 3: Member Portal IDOR Isolation (Spec §9 & §11)
|--------------------------------------------------------------------------
*/

it('strictly isolates member personal donation data and prevents IDOR cross-boundary access', function () {
    $cat = Category::create([
        'name' => 'Perpuluhan',
        'direction' => Direction::In,
        'default_fund_id' => $this->fund->id,
        'allows_named' => true,
        'is_public' => true,
        'is_active' => true,
    ]);

    // Member 1
    $user1 = User::factory()->create(['name' => 'Jemaat 1']);
    $user1->assignRole(Role::Jemaat->value);
    $member1 = Member::create([
        'user_id' => $user1->id,
        'member_number' => 'MEM-001',
        'name' => 'Anggota Jemaat Pertama',
        'is_active' => true,
    ]);

    $donation1 = Donation::create([
        'member_id' => $member1->id,
        'donor_name' => $member1->name,
        'category_id' => $cat->id,
        'amount' => 700000,
        'receipt_number' => 'RCP-M1-001',
        'created_at' => '2026-10-10 09:00:00',
    ]);

    // Member 2
    $user2 = User::factory()->create(['name' => 'Jemaat 2']);
    $user2->assignRole(Role::Jemaat->value);
    $member2 = Member::create([
        'user_id' => $user2->id,
        'member_number' => 'MEM-002',
        'name' => 'Anggota Jemaat Kedua',
        'is_active' => true,
    ]);

    $donation2 = Donation::create([
        'member_id' => $member2->id,
        'donor_name' => $member2->name,
        'category_id' => $cat->id,
        'amount' => 1500000,
        'receipt_number' => 'RCP-M2-002',
        'created_at' => '2026-10-12 10:00:00',
    ]);

    // --- Testing as User 1 ---
    $this->actingAs($user1);

    // Index: Can see donation 1, NEVER donation 2
    $resp1 = $this->get(route('portal.index'));
    $resp1->assertOk();
    $content1 = $resp1->getContent();
    expect($content1)->toContain('RCP-M1-001')
        ->and($content1)->not->toContain('RCP-M2-002')
        ->and($content1)->not->toContain('Anggota Jemaat Kedua');

    // Receipt IDOR: Can view own receipt, blocked from other's receipt with 403
    $this->get(route('portal.receipt', $donation1->id))->assertOk();
    $this->get(route('portal.receipt', $donation2->id))->assertStatus(403);

    // Statement IDOR: Only includes own donations
    $stmt1 = $this->get(route('portal.statement', ['year' => 2026]));
    $stmt1->assertOk();
    $stmtContent1 = $stmt1->getContent();
    expect($stmtContent1)->toContain('RCP-M1-001')
        ->and($stmtContent1)->not->toContain('RCP-M2-002');

    // --- Testing as User 2 ---
    $this->actingAs($user2);

    // Index: Can see donation 2, NEVER donation 1
    $resp2 = $this->get(route('portal.index'));
    $resp2->assertOk();
    $content2 = $resp2->getContent();
    expect($content2)->toContain('RCP-M2-002')
        ->and($content2)->not->toContain('RCP-M1-001')
        ->and($content2)->not->toContain('Anggota Jemaat Pertama');

    // Receipt IDOR: Can view own receipt, blocked from other's receipt with 403
    $this->get(route('portal.receipt', $donation2->id))->assertOk();
    $this->get(route('portal.receipt', $donation1->id))->assertStatus(403);
});

/*
|--------------------------------------------------------------------------
| Invariant 4: Mathematical Ledger Consistency (Spec §11)
|--------------------------------------------------------------------------
*/

it('maintains mathematical balance equality between ledger sum and fund balances', function () {
    $fund2 = Fund::create([
        'code' => 'MISI-INV',
        'name' => 'Dana Misi',
        'is_active' => true,
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 5000000,
        'direction' => Direction::In,
        'description' => 'In 1',
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $this->fund->id,
        'amount' => 1200000,
        'direction' => Direction::Out,
        'description' => 'Out 1',
    ]);

    LedgerService::record([
        'entry_date' => '2026-10-21',
        'account_id' => $this->account->id,
        'fund_id' => $fund2->id,
        'amount' => 3000000,
        'direction' => Direction::In,
        'description' => 'In 2',
    ]);

    $allEntriesIn = LedgerEntry::where('direction', Direction::In->value)->sum('amount');
    $allEntriesOut = LedgerEntry::where('direction', Direction::Out->value)->sum('amount');
    $netLedgerBalance = $allEntriesIn - $allEntriesOut;

    $fund1Balance = LedgerEntry::getBalance($this->fund->id);
    $fund2Balance = LedgerEntry::getBalance($fund2->id);

    expect($fund1Balance)->toBe(3800000)
        ->and($fund2Balance)->toBe(3000000)
        ->and($fund1Balance + $fund2Balance)->toBe($netLedgerBalance);
});
