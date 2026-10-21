<?php

namespace App\Services;

class CountCalculationService
{
    /**
     * Re-calculate denomination amounts and total amount strictly server-side.
     *
     * @param  array<int, array<string, mixed>>  $rawLines
     * @return array{lines: array<int, array<string, mixed>>, total_amount: int}
     */
    public function calculate(array $rawLines): array
    {
        $calculatedLines = [];
        $totalAmount = 0;

        foreach ($rawLines as $line) {
            $isCash = (bool) ($line['is_cash'] ?? true);
            $denominationCounts = $line['denomination_counts'] ?? null;
            $lineAmount = 0;
            $cleanedDenominations = null;

            if ($isCash && is_array($denominationCounts)) {
                $cleanedDenominations = [];
                foreach ($denominationCounts as $denom => $count) {
                    $denomInt = (int) $denom;
                    $countInt = (int) $count;

                    if ($denomInt > 0 && $countInt > 0) {
                        $cleanedDenominations[(string) $denomInt] = $countInt;
                        $lineAmount += ($denomInt * $countInt);
                    }
                }
            } elseif (! $isCash) {
                $lineAmount = max(0, (int) ($line['amount'] ?? 0));
                $cleanedDenominations = null;
            } else {
                $lineAmount = max(0, (int) ($line['amount'] ?? 0));
            }

            $calculatedLines[] = [
                'id' => $line['id'] ?? null,
                'category_id' => (int) $line['category_id'],
                'is_cash' => $isCash,
                'denomination_counts' => $cleanedDenominations,
                'amount' => $lineAmount,
                'reference_number' => $line['reference_number'] ?? null,
                'proof_path' => $line['proof_path'] ?? null,
            ];

            $totalAmount += $lineAmount;
        }

        return [
            'lines' => $calculatedLines,
            'total_amount' => $totalAmount,
        ];
    }
}
