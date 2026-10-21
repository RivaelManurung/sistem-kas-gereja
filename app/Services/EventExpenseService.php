<?php

namespace App\Services;

use App\Enums\Direction;
use App\Models\Event;
use App\Models\Expense;
use App\Models\LedgerEntry;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EventExpenseService
{
    public function __construct(
        protected LedgerService $ledgerService,
        protected ExpenseService $expenseService
    ) {}

    /**
     * Submit an event expense into the unified Fase 3 approval pipeline,
     * scoped to the event's dedicated fund.
     */
    public function submitExpense(Event $event, array $data, User $submitter, UploadedFile|string $proof): Expense
    {
        if ($event->isClosed()) {
            throw new InvalidArgumentException('Tidak dapat mencatat pengeluaran untuk acara yang sudah ditutup.');
        }

        $data['fund_id'] = $event->fund_id;
        $data['event_id'] = $event->id;

        return $this->expenseService->submit($data, $submitter, $proof);
    }

    /**
     * Record an expense directly for an event, debiting the event's dedicated fund.
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
