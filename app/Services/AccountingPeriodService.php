<?php

namespace App\Services;

use App\Enums\Direction;
use App\Models\AccountingPeriod;
use App\Models\LedgerEntry;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use LogicException;

class AccountingPeriodService
{
    public function recordOpeningBalance(AccountingPeriod $period, array $data): LedgerEntry
    {
        if ($period->is_closed) {
            throw new LogicException('Tidak dapat mencatat saldo awal pada periode yang sudah ditutup.');
        }

        $date = $data['date'] ?? $period->start_date->toDateString();
        $dateStr = is_string($date) ? $date : $date->toDateString();

        if ($dateStr < $period->start_date->toDateString() || $dateStr > $period->end_date->toDateString()) {
            throw ValidationException::withMessages([
                'date' => 'Tanggal saldo awal harus berada dalam rentang periode akuntansi.',
            ]);
        }

        $idempotencyKey = "op-{$period->id}-acc-{$data['account_id']}-fund-{$data['fund_id']}-" . md5($dateStr . ($data['amount'] ?? ''));

        return LedgerService::record([
            'entry_date' => $dateStr,
            'account_id' => $data['account_id'],
            'fund_id' => $data['fund_id'],
            'category_id' => $data['category_id'] ?? null,
            'amount' => (int) $data['amount'],
            'direction' => Direction::In,
            'description' => $data['description'] ?? "Saldo Awal ({$period->name})",
            'source_type' => 'accounting_period',
            'source_id' => $period->id,
            'idempotency_key' => $idempotencyKey,
        ]);
    }

    public function close(AccountingPeriod $period, User $user): AccountingPeriod
    {
        if ($period->is_closed) {
            throw new LogicException('Periode akuntansi ini sudah dalam status ditutup.');
        }

        $period->close($user);

        return $period;
    }
}
