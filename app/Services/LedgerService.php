<?php

namespace App\Services;

use App\Enums\Direction;
use App\Models\LedgerEntry;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    public static function record(array $data): LedgerEntry
    {
        return DB::transaction(function () use ($data) {
            $direction = $data['direction'] instanceof Direction ? $data['direction'] : Direction::from($data['direction']);
            $data['direction'] = $direction->value;

            return LedgerEntry::create($data);
        });
    }

    public static function reverse(LedgerEntry $original, string $reason): LedgerEntry
    {
        return DB::transaction(function () use ($original, $reason) {
            $reversedDirection = $original->direction === Direction::In ? Direction::Out : Direction::In;

            return LedgerEntry::create([
                'entry_date' => now()->toDateString(),
                'account_id' => $original->account_id,
                'fund_id' => $original->fund_id,
                'category_id' => $original->category_id,
                'amount' => $original->amount,
                'direction' => $reversedDirection->value,
                'description' => "Pembalik #{$original->id}: {$reason}",
                'source_type' => $original->source_type,
                'source_id' => $original->source_id,
                'reverses_id' => $original->id,
            ]);
        });
    }
}
