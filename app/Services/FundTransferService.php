<?php

namespace App\Services;

use App\Enums\Direction;
use App\Enums\FundTransferStatus;
use App\Enums\Role;
use App\Models\AccountingPeriod;
use App\Models\ChurchSetting;
use App\Models\FundTransfer;
use App\Models\LedgerEntry;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use LogicException;

class FundTransferService
{
    public function request(array $data, User $requester): FundTransfer
    {
        if ((int) $data['from_fund_id'] === (int) $data['to_fund_id']) {
            throw ValidationException::withMessages([
                'to_fund_id' => 'Pos dana tujuan tidak boleh sama dengan pos dana asal.',
            ]);
        }

        if (AccountingPeriod::isDateClosed($data['transfer_date'])) {
            throw ValidationException::withMessages([
                'transfer_date' => 'Tidak dapat mengajukan pindah dana pada periode akuntansi yang sudah ditutup.',
            ]);
        }

        return FundTransfer::create([
            'from_fund_id' => $data['from_fund_id'],
            'to_fund_id' => $data['to_fund_id'],
            'account_id' => $data['account_id'],
            'amount' => (int) $data['amount'],
            'transfer_date' => $data['transfer_date'],
            'reason' => $data['reason'],
            'status' => FundTransferStatus::Pending,
            'requested_by' => $requester->id,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function approve(FundTransfer $transfer, User $approver, ?string $notes = null): FundTransfer
    {
        if ($transfer->status !== FundTransferStatus::Pending) {
            throw new LogicException('Permohonan pindah dana ini tidak dalam status menunggu persetujuan.');
        }

        // Anti self-approval
        if ($transfer->requested_by === $approver->id) {
            abort(403, 'Pemohon tidak boleh menyetujui permohonan pindah dana sendiri.');
        }

        if (! $approver->hasAnyRole([Role::Bendahara->value, Role::Majelis->value, Role::Admin->value])) {
            abort(403, 'Anda tidak memiliki wewenang untuk menyetujui pindah dana.');
        }

        // Negative balance protection on from_fund
        $setting = ChurchSetting::current();
        $sourceBalance = LedgerEntry::getBalance($transfer->from_fund_id);
        if ($sourceBalance < $transfer->amount && ! $setting->allow_negative_balance) {
            throw ValidationException::withMessages([
                'amount' => 'Saldo dana asal tidak mencukupi untuk pemindahan dana ini.',
            ]);
        }

        if (AccountingPeriod::isDateClosed($transfer->transfer_date)) {
            throw ValidationException::withMessages([
                'transfer_date' => 'Periode akuntansi pada tanggal pemindahan dana ini sudah ditutup.',
            ]);
        }

        return DB::transaction(function () use ($transfer, $approver, $notes) {
            $transfer->load(['fromFund', 'toFund']);
            $dateString = $transfer->transfer_date->toDateString();

            // 1. OUT from from_fund_id
            LedgerService::record([
                'entry_date' => $dateString,
                'account_id' => $transfer->account_id,
                'fund_id' => $transfer->from_fund_id,
                'amount' => $transfer->amount,
                'direction' => Direction::Out,
                'description' => "Pindah Dana ke {$transfer->toFund->name}: {$transfer->reason}",
                'source_type' => 'fund_transfer',
                'source_id' => $transfer->id,
                'idempotency_key' => "ft-{$transfer->id}-out",
            ]);

            // 2. IN to to_fund_id
            LedgerService::record([
                'entry_date' => $dateString,
                'account_id' => $transfer->account_id,
                'fund_id' => $transfer->to_fund_id,
                'amount' => $transfer->amount,
                'direction' => Direction::In,
                'description' => "Pindah Dana dari {$transfer->fromFund->name}: {$transfer->reason}",
                'source_type' => 'fund_transfer',
                'source_id' => $transfer->id,
                'idempotency_key' => "ft-{$transfer->id}-in",
            ]);

            $transfer->update([
                'status' => FundTransferStatus::Approved,
                'approved_by' => $approver->id,
                'approved_at' => now(),
                'notes' => $notes ?? $transfer->notes,
            ]);

            return $transfer;
        });
    }

    public function reject(FundTransfer $transfer, User $user, ?string $notes = null): FundTransfer
    {
        if ($transfer->status !== FundTransferStatus::Pending) {
            throw new LogicException('Permohonan pindah dana ini tidak dalam status menunggu persetujuan.');
        }

        if ($transfer->requested_by === $user->id) {
            abort(403, 'Pemohon tidak dapat memproses permohonan pindah dananya sendiri.');
        }

        if (! $user->hasAnyRole([Role::Bendahara->value, Role::Majelis->value, Role::Admin->value])) {
            abort(403, 'Anda tidak memiliki wewenang untuk menolak pindah dana.');
        }

        $transfer->update([
            'status' => FundTransferStatus::Rejected,
            'notes' => $notes ?? $transfer->notes,
        ]);

        return $transfer;
    }
}
