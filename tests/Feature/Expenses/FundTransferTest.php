<?php

use App\Enums\Direction;
use App\Enums\FundTransferStatus;
use App\Enums\Role;
use App\Models\Account;
use App\Models\ChurchSetting;
use App\Models\Fund;
use App\Models\FundTransfer;
use App\Models\LedgerEntry;
use App\Services\LedgerService;

beforeEach(function () {
    $this->setting = ChurchSetting::current();
    $this->setting->update([
        'allow_negative_balance' => false,
    ]);

    $this->account = Account::create([
        'code' => 'KAS-OPERASIONAL',
        'name' => 'Kas Operasional',
        'type' => 'cash',
        'is_active' => true,
    ]);

    $this->fromFund = Fund::create([
        'code' => 'UMUM',
        'name' => 'Kas Umum',
        'is_active' => true,
    ]);

    $this->toFund = Fund::create([
        'code' => 'PEMB',
        'name' => 'Dana Pembangunan',
        'is_active' => true,
    ]);

    // Give fromFund an initial balance of 10,000,000
    LedgerService::record([
        'entry_date' => '2026-10-01',
        'account_id' => $this->account->id,
        'fund_id' => $this->fromFund->id,
        'amount' => 10000000,
        'direction' => Direction::In,
        'description' => 'Saldo awal kas umum',
    ]);
});

it('creates a fund transfer request in pending status', function () {
    $user = actingAsRole(Role::Bendahara);

    $response = $this->post(route('transfers.store'), [
        'from_fund_id' => $this->fromFund->id,
        'to_fund_id' => $this->toFund->id,
        'account_id' => $this->account->id,
        'amount' => 3000000,
        'transfer_date' => '2026-10-21',
        'reason' => 'Bantuan kas umum untuk renovasi kanopi gereja',
    ]);

    $response->assertRedirect(route('transfers.index'));

    $transfer = FundTransfer::first();
    expect($transfer)->not->toBeNull()
        ->and($transfer->status)->toBe(FundTransferStatus::Pending)
        ->and($transfer->from_fund_id)->toBe($this->fromFund->id)
        ->and($transfer->to_fund_id)->toBe($this->toFund->id)
        ->and($transfer->amount)->toBe(3000000)
        ->and($transfer->requested_by)->toBe($user->id)
        ->and($transfer->reason)->toBe('Bantuan kas umum untuk renovasi kanopi gereja');
});

it('rejects fund transfer if from_fund and to_fund are identical', function () {
    actingAsRole(Role::Bendahara);

    $response = $this->post(route('transfers.store'), [
        'from_fund_id' => $this->fromFund->id,
        'to_fund_id' => $this->fromFund->id, // same fund!
        'account_id' => $this->account->id,
        'amount' => 1000000,
        'transfer_date' => '2026-10-21',
        'reason' => 'Transfer ke dana yang sama',
    ]);

    $response->assertSessionHasErrors(['from_fund_id', 'to_fund_id']);
    expect(FundTransfer::count())->toBe(0);
});

it('prohibits requester from approving own fund transfer request (anti self-approval)', function () {
    $requester = actingAsRole(Role::Bendahara);

    $transfer = FundTransfer::create([
        'from_fund_id' => $this->fromFund->id,
        'to_fund_id' => $this->toFund->id,
        'account_id' => $this->account->id,
        'amount' => 1000000,
        'transfer_date' => '2026-10-21',
        'reason' => 'Pindah dana kas',
        'status' => FundTransferStatus::Pending,
        'requested_by' => $requester->id,
    ]);

    // Requester tries to approve
    $response = $this->post(route('transfers.approve', $transfer->id));
    $response->assertStatus(403);

    $transfer->refresh();
    expect($transfer->status)->toBe(FundTransferStatus::Pending);
});

it('records 2 ledger entries (1 out, 1 in) when fund transfer is approved', function () {
    $requester = actingAsRole(Role::Penghitung);

    $transfer = FundTransfer::create([
        'from_fund_id' => $this->fromFund->id,
        'to_fund_id' => $this->toFund->id,
        'account_id' => $this->account->id,
        'amount' => 4000000,
        'transfer_date' => '2026-10-21',
        'reason' => 'Subsidi dana pembangunan gereja',
        'status' => FundTransferStatus::Pending,
        'requested_by' => $requester->id,
    ]);

    $approver = actingAsRole(Role::Bendahara);
    $response = $this->post(route('transfers.approve', $transfer->id), [
        'notes' => 'Disetujui sesuai rapat',
    ]);

    $response->assertRedirect(route('transfers.index'));

    $transfer->refresh();
    expect($transfer->status)->toBe(FundTransferStatus::Approved)
        ->and($transfer->approved_by)->toBe($approver->id)
        ->and($transfer->approved_at)->not->toBeNull();

    // Check ledger entries
    $entries = LedgerEntry::where('source_type', 'fund_transfer')
        ->where('source_id', $transfer->id)
        ->get();

    expect($entries)->toHaveCount(2);

    $outEntry = $entries->firstWhere('direction', Direction::Out);
    $inEntry = $entries->firstWhere('direction', Direction::In);

    expect($outEntry)->not->toBeNull()
        ->and($outEntry->fund_id)->toBe($this->fromFund->id)
        ->and($outEntry->amount)->toBe(4000000)
        ->and($outEntry->account_id)->toBe($this->account->id);

    expect($inEntry)->not->toBeNull()
        ->and($inEntry->fund_id)->toBe($this->toFund->id)
        ->and($inEntry->amount)->toBe(4000000)
        ->and($inEntry->account_id)->toBe($this->account->id);

    // Check resulting fund balances
    // fromFund: 10,000,000 - 4,000,000 = 6,000,000
    expect(LedgerEntry::getBalance($this->fromFund->id))->toBe(6000000);
    // toFund: 0 + 4,000,000 = 4,000,000
    expect(LedgerEntry::getBalance($this->toFund->id))->toBe(4000000);
});

it('allows rejecting fund transfer request with notes', function () {
    $requester = actingAsRole(Role::Penghitung);

    $transfer = FundTransfer::create([
        'from_fund_id' => $this->fromFund->id,
        'to_fund_id' => $this->toFund->id,
        'account_id' => $this->account->id,
        'amount' => 1000000,
        'transfer_date' => '2026-10-21',
        'reason' => 'Pindah dana',
        'status' => FundTransferStatus::Pending,
        'requested_by' => $requester->id,
    ]);

    actingAsRole(Role::Bendahara);
    $response = $this->post(route('transfers.reject', $transfer->id), [
        'notes' => 'Tidak diizinkan karena pos asal memiliki komitmen lain',
    ]);

    $response->assertRedirect(route('transfers.index'));

    $transfer->refresh();
    expect($transfer->status)->toBe(FundTransferStatus::Rejected)
        ->and($transfer->notes)->toBe('Tidak diizinkan karena pos asal memiliki komitmen lain');

    expect(LedgerEntry::where('source_type', 'fund_transfer')->count())->toBe(0);
});
