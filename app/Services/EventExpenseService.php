<?php

namespace App\Services;

use App\Enums\Direction;
use App\Models\Event;
use App\Models\LedgerEntry;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EventExpenseService
{
    public function __construct(
        protected LedgerService $ledgerService
    ) {}

    /**
     * Record an expense for an event, directly debiting the event's dedicated fund.
     *
     * @param array{
     *     entry_date: string,
     *     account_id: int,
     *     category_id: int,
     *     amount: int,
     *     description?: string|null,
     *     idempotency_key?: string|null
     * } $data
     */
    public function recordExpense(Event $event, array $data): LedgerEntry
    {
        if ((int) $data['amount'] <= 0) {
            throw new InvalidArgumentException('Nominal pengeluaran harus lebih besar dari 0.');
        }

        if ($event->isClosed()) {
            throw new InvalidArgumentException('Tidak dapat mencatat pengeluaran untuk acara yang sudah ditutup.');
        }

        return DB::transaction(function () use ($event, $data) {
            return $this->ledgerService->record([
                'entry_date' => $data['entry_date'],
                'account_id' => $data['account_id'],
                'fund_id' => $event->fund_id,
                'category_id' => $data['category_id'],
                'amount' => (int) $data['amount'],
                'direction' => Direction::Out,
                'description' => $data['description'] ?? "Pengeluaran Acara: {$event->name}",
                'source_type' => 'event',
                'source_id' => $event->id,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);
        });
    }
}
