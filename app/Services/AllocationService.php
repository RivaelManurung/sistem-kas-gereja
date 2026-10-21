<?php

namespace App\Services;

use App\Enums\CountSheetStatus;
use App\Enums\Direction;
use App\Models\AllocationRule;
use App\Models\CountSheet;
use App\Models\LedgerEntry;
use Illuminate\Support\Facades\DB;
use LogicException;

class AllocationService
{
    public function __construct(
        protected LedgerService $ledgerService
    ) {}

    /**
     * Apply allocation rules to a verified count sheet and post to ledger entries.
     *
     * @return array<int, LedgerEntry>
     */
    public function apply(CountSheet $sheet): array
    {
        if ($sheet->isLocked()) {
            throw new LogicException('Berita acara ini sudah dikunci ke buku besar.');
        }

        return DB::transaction(function () use ($sheet) {
            $sheet->load(['lines.category', 'serviceSession']);
            $dateString = $sheet->date->toDateString();
            $ledgerEntries = [];

            foreach ($sheet->lines as $line) {
                if ($line->amount <= 0) {
                    continue;
                }

                $rule = AllocationRule::findActiveRuleFor($line->category_id, $dateString);

                if ($rule && $rule->items->isNotEmpty()) {
                    $items = $rule->items;
                    $allocatedSum = 0;
                    $allocations = [];

                    foreach ($items as $item) {
                        $allocated = (int) floor($line->amount * ((float) $item->percentage / 100));
                        $allocations[] = [
                            'item' => $item,
                            'amount' => $allocated,
                        ];
                        $allocatedSum += $allocated;
                    }

                    // Remainder rounding strictly to the first fund
                    $remainder = $line->amount - $allocatedSum;
                    if ($remainder > 0 && count($allocations) > 0) {
                        $allocations[0]['amount'] += $remainder;
                    }

                    foreach ($allocations as $alloc) {
                        $item = $alloc['item'];
                        $amount = $alloc['amount'];

                        if ($amount <= 0) {
                            continue;
                        }

                        $entry = $this->ledgerService->record([
                            'entry_date' => $dateString,
                            'account_id' => $sheet->account_id,
                            'fund_id' => $item->fund_id,
                            'category_id' => $line->category_id,
                            'amount' => $amount,
                            'direction' => Direction::In,
                            'description' => "Alokasi {$line->category->name} ({$item->fund->name} {$item->percentage}%)",
                            'source_type' => 'count_sheet',
                            'source_id' => $sheet->id,
                            'idempotency_key' => "cs-{$sheet->id}-line-{$line->id}-fund-{$item->fund_id}",
                        ]);

                        $ledgerEntries[] = $entry;
                    }
                } else {
                    // Fallback to 100% on category's default fund
                    $entry = $this->ledgerService->record([
                        'entry_date' => $dateString,
                        'account_id' => $sheet->account_id,
                        'fund_id' => $line->category->default_fund_id,
                        'category_id' => $line->category_id,
                        'amount' => $line->amount,
                        'direction' => Direction::In,
                        'description' => "Penerimaan {$line->category->name}",
                        'source_type' => 'count_sheet',
                        'source_id' => $sheet->id,
                        'idempotency_key' => "cs-{$sheet->id}-line-{$line->id}-default",
                    ]);

                    $ledgerEntries[] = $entry;
                }
            }

            $sheet->update([
                'status' => CountSheetStatus::Locked,
            ]);

            if ($sheet->service_session_id && $sheet->serviceSession) {
                $sheet->serviceSession->update([
                    'is_completed' => true,
                ]);
            }

            return $ledgerEntries;
        });
    }
}
