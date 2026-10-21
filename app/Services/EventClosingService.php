<?php

namespace App\Services;

use App\Enums\Direction;
use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\Fund;
use App\Models\LedgerEntry;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use LogicException;

class EventClosingService
{
    public function __construct(
        protected LedgerService $ledgerService
    ) {}

    /**
     * Close an event. If the event fund has remaining positive balance,
     * transfer it to targetFundId via ledger entries.
     *
     * @return array{
     *     event: Event,
     *     transferred_balance: int,
     *     target_fund: Fund|null,
     *     ledger_entries: array<int, LedgerEntry>
     * }
     */
    public function close(Event $event, ?int $targetFundId = null, ?string $notes = null): array
    {
        if ($event->isClosed()) {
            throw new LogicException('Acara ini sudah ditutup.');
        }

        return DB::transaction(function () use ($event, $targetFundId, $notes) {
            $balance = LedgerEntry::getBalance($event->fund_id);
            $transferred = 0;
            $targetFund = null;
            $entries = [];

            if ($balance > 0) {
                if (! $targetFundId) {
                    throw new InvalidArgumentException('Pos dana tujuan pemindahan sisa saldo wajib dipilih.');
                }

                $targetFund = Fund::findOrFail($targetFundId);
                if ($targetFund->id === $event->fund_id) {
                    throw new InvalidArgumentException('Pos dana tujuan tidak boleh sama dengan pos dana acara.');
                }

                // Query accounts with positive balance for this fund
                $accountsWithBalance = LedgerEntry::where('fund_id', $event->fund_id)
                    ->select('account_id')
                    ->selectRaw("SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END) as balance")
                    ->groupBy('account_id')
                    ->havingRaw("SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END) > 0")
                    ->get();

                $dateString = now()->toDateString();
                foreach ($accountsWithBalance as $acc) {
                    $accBalance = (int) $acc->balance;
                    if ($accBalance <= 0) {
                        continue;
                    }

                    // 1. Out from event fund
                    $outEntry = $this->ledgerService->record([
                        'entry_date' => $dateString,
                        'account_id' => $acc->account_id,
                        'fund_id' => $event->fund_id,
                        'amount' => $accBalance,
                        'direction' => Direction::Out,
                        'description' => "Penutupan Acara {$event->name}: Pemindahan sisa saldo ke {$targetFund->name}",
                        'source_type' => 'event',
                        'source_id' => $event->id,
                        'idempotency_key' => "event-{$event->id}-close-out-acc-{$acc->account_id}",
                    ]);

                    // 2. In to target fund
                    $inEntry = $this->ledgerService->record([
                        'entry_date' => $dateString,
                        'account_id' => $acc->account_id,
                        'fund_id' => $targetFund->id,
                        'amount' => $accBalance,
                        'direction' => Direction::In,
                        'description' => "Penutupan Acara {$event->name}: Penerimaan sisa saldo dari {$event->name}".($notes ? " ({$notes})" : ''),
                        'source_type' => 'event',
                        'source_id' => $event->id,
                        'idempotency_key' => "event-{$event->id}-close-in-acc-{$acc->account_id}",
                    ]);

                    $entries[] = $outEntry;
                    $entries[] = $inEntry;
                    $transferred += $accBalance;
                }
            }

            // Deactivate the event fund
            if ($event->fund) {
                $event->fund->update(['is_active' => false]);
            }

            // Update event status to closed
            $event->update([
                'status' => EventStatus::Closed,
            ]);

            return [
                'event' => $event,
                'transferred_balance' => $transferred,
                'target_fund' => $targetFund,
                'ledger_entries' => $entries,
            ];
        });
    }
}
