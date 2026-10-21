<?php

namespace App\Services;

use App\Enums\Direction;
use App\Models\Account;
use App\Models\Category;
use App\Models\Fund;
use App\Models\LedgerEntry;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FinancialReportService
{
    /**
     * Resolve date range and label for various periodic report types.
     *
     * @return array{start_date: string, end_date: string, label: string, period_type: string}
     */
    public function resolvePeriod(
        string $periodType,
        ?string $from = null,
        ?string $to = null,
        ?int $year = null,
        ?int $month = null,
        ?int $quarter = null,
        ?int $semester = null,
        ?string $date = null
    ): array {
        $now = now();
        $y = $year ?? $now->year;

        switch ($periodType) {
            case 'harian':
                $targetDate = $date ?? $from ?? $now->toDateString();
                $c = Carbon::parse($targetDate);
                return [
                    'period_type' => 'harian',
                    'start_date' => $c->toDateString(),
                    'end_date' => $c->toDateString(),
                    'label' => 'Laporan Harian ('.$c->translatedFormat('d F Y').')',
                ];

            case 'mingguan':
                $ref = $date ? Carbon::parse($date) : ($from ? Carbon::parse($from) : $now);
                $start = $ref->copy()->startOfWeek(Carbon::MONDAY);
                $end = $start->copy()->addDays(6);
                return [
                    'period_type' => 'mingguan',
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'label' => 'Laporan Mingguan ('.$start->translatedFormat('d M Y').' - '.$end->translatedFormat('d M Y').')',
                ];

            case 'bulanan':
                $m = $month ?? $now->month;
                $start = Carbon::create($y, $m, 1)->startOfMonth();
                $end = $start->copy()->endOfMonth();
                return [
                    'period_type' => 'bulanan',
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'label' => 'Laporan Bulanan ('.$start->translatedFormat('F Y').')',
                ];

            case 'triwulan':
                $q = $quarter ?? (int) ceil(($month ?? $now->month) / 3);
                $startMonth = (($q - 1) * 3) + 1;
                $start = Carbon::create($y, $startMonth, 1)->startOfMonth();
                $end = $start->copy()->addMonths(2)->endOfMonth();
                return [
                    'period_type' => 'triwulan',
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'label' => "Laporan Triwulan {$q} {$y} (".$start->translatedFormat('M').' - '.$end->translatedFormat('M Y').')',
                ];

            case 'semester':
                $s = $semester ?? (($month ?? $now->month) <= 6 ? 1 : 2);
                $startMonth = $s === 1 ? 1 : 7;
                $start = Carbon::create($y, $startMonth, 1)->startOfMonth();
                $end = $start->copy()->addMonths(5)->endOfMonth();
                return [
                    'period_type' => 'semester',
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'label' => "Laporan Semester {$s} {$y} (".$start->translatedFormat('M').' - '.$end->translatedFormat('M Y').')',
                ];

            case 'tahunan':
                $start = Carbon::create($y, 1, 1)->startOfYear();
                $end = $start->copy()->endOfYear();
                return [
                    'period_type' => 'tahunan',
                    'start_date' => $start->toDateString(),
                    'end_date' => $end->toDateString(),
                    'label' => "Laporan Tahunan {$y}",
                ];

            case 'custom':
            default:
                $startDate = $from ?? $now->startOfMonth()->toDateString();
                $endDate = $to ?? $now->endOfMonth()->toDateString();
                $cStart = Carbon::parse($startDate);
                $cEnd = Carbon::parse($endDate);
                return [
                    'period_type' => 'custom',
                    'start_date' => $cStart->toDateString(),
                    'end_date' => $cEnd->toDateString(),
                    'label' => 'Laporan Periode ('.$cStart->translatedFormat('d M Y').' - '.$cEnd->translatedFormat('d M Y').')',
                ];
        }
    }

    /**
     * Generate the complete financial report for the given date range.
     *
     * @return array<string, mixed>
     */
    public function generate(string $startDate, string $endDate): array
    {
        $funds = Fund::orderBy('code')->get();
        $accounts = Account::orderBy('code')->get();
        $inCategories = Category::where('direction', Direction::In->value)->orderBy('sort_order')->orderBy('name')->get();
        $outCategories = Category::where('direction', Direction::Out->value)->orderBy('sort_order')->orderBy('name')->get();

        // 1. SALDO AWAL (entry_date < $startDate)
        $openingBalancesByFund = [];
        $totalOpeningFund = 0;
        foreach ($funds as $fund) {
            $in = (int) LedgerEntry::where('fund_id', $fund->id)
                ->where('entry_date', '<', $startDate)
                ->where('direction', Direction::In->value)
                ->sum('amount');
            $out = (int) LedgerEntry::where('fund_id', $fund->id)
                ->where('entry_date', '<', $startDate)
                ->where('direction', Direction::Out->value)
                ->sum('amount');
            $balance = $in - $out;

            $openingBalancesByFund[] = [
                'fund_id' => $fund->id,
                'fund_code' => $fund->code,
                'fund_name' => $fund->name,
                'balance' => $balance,
            ];
            $totalOpeningFund += $balance;
        }

        $openingBalancesByAccount = [];
        $totalOpeningAccount = 0;
        foreach ($accounts as $account) {
            $in = (int) LedgerEntry::where('account_id', $account->id)
                ->where('entry_date', '<', $startDate)
                ->where('direction', Direction::In->value)
                ->sum('amount');
            $out = (int) LedgerEntry::where('account_id', $account->id)
                ->where('entry_date', '<', $startDate)
                ->where('direction', Direction::Out->value)
                ->sum('amount');
            $balance = $in - $out;

            $openingBalancesByAccount[] = [
                'account_id' => $account->id,
                'account_code' => $account->code,
                'account_name' => $account->name,
                'account_type' => $account->type->value ?? 'cash',
                'balance' => $balance,
            ];
            $totalOpeningAccount += $balance;
        }

        // 2. PEMASUKAN (Categories with Direction In within period)
        $incomeByCategory = [];
        $totalIncome = 0;
        foreach ($inCategories as $cat) {
            $inSum = (int) LedgerEntry::where('category_id', $cat->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::In->value)
                ->sum('amount');
            $outSum = (int) LedgerEntry::where('category_id', $cat->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::Out->value)
                ->sum('amount');
            $net = $inSum - $outSum;

            // Breakdown per fund
            $fundBreakdown = [];
            foreach ($funds as $f) {
                $fIn = (int) LedgerEntry::where('category_id', $cat->id)
                    ->where('fund_id', $f->id)
                    ->whereBetween('entry_date', [$startDate, $endDate])
                    ->where('direction', Direction::In->value)
                    ->sum('amount');
                $fOut = (int) LedgerEntry::where('category_id', $cat->id)
                    ->where('fund_id', $f->id)
                    ->whereBetween('entry_date', [$startDate, $endDate])
                    ->where('direction', Direction::Out->value)
                    ->sum('amount');
                $fNet = $fIn - $fOut;
                if ($fNet !== 0) {
                    $fundBreakdown[] = [
                        'fund_id' => $f->id,
                        'fund_name' => $f->name,
                        'amount' => $fNet,
                    ];
                }
            }

            if ($net !== 0 || $cat->is_active) {
                $incomeByCategory[] = [
                    'category_id' => $cat->id,
                    'category_name' => $cat->name,
                    'total' => $net,
                    'by_fund' => $fundBreakdown,
                ];
                $totalIncome += $net;
            }
        }

        // Uncategorized Incomes (e.g. accounting_period opening balance inside period or other non-transfer entries)
        $uncategorizedIn = (int) LedgerEntry::whereNull('category_id')
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->where('direction', Direction::In->value)
            ->whereNotIn('source_type', ['fund_transfer', 'bank_deposit'])
            ->where(function ($q) {
                $q->whereNull('description')
                    ->orWhere('description', 'not like', '%Penutupan Acara%');
            })
            ->sum('amount');
        if ($uncategorizedIn > 0) {
            $incomeByCategory[] = [
                'category_id' => null,
                'category_name' => 'Pemasukan Lain-lain',
                'total' => $uncategorizedIn,
                'by_fund' => [],
            ];
            $totalIncome += $uncategorizedIn;
        }

        // 3. PENGELUARAN (Categories with Direction Out within period)
        $expenseByCategory = [];
        $totalExpense = 0;
        foreach ($outCategories as $cat) {
            $outSum = (int) LedgerEntry::where('category_id', $cat->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::Out->value)
                ->sum('amount');
            $inSum = (int) LedgerEntry::where('category_id', $cat->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::In->value)
                ->sum('amount');
            $net = $outSum - $inSum;

            // Breakdown per fund
            $fundBreakdown = [];
            foreach ($funds as $f) {
                $fOut = (int) LedgerEntry::where('category_id', $cat->id)
                    ->where('fund_id', $f->id)
                    ->whereBetween('entry_date', [$startDate, $endDate])
                    ->where('direction', Direction::Out->value)
                    ->sum('amount');
                $fIn = (int) LedgerEntry::where('category_id', $cat->id)
                    ->where('fund_id', $f->id)
                    ->whereBetween('entry_date', [$startDate, $endDate])
                    ->where('direction', Direction::In->value)
                    ->sum('amount');
                $fNet = $fOut - $fIn;
                if ($fNet !== 0) {
                    $fundBreakdown[] = [
                        'fund_id' => $f->id,
                        'fund_name' => $f->name,
                        'amount' => $fNet,
                    ];
                }
            }

            if ($net !== 0 || $cat->is_active) {
                $expenseByCategory[] = [
                    'category_id' => $cat->id,
                    'category_name' => $cat->name,
                    'total' => $net,
                    'by_fund' => $fundBreakdown,
                ];
                $totalExpense += $net;
            }
        }

        // Uncategorized Expenses
        $uncategorizedOut = (int) LedgerEntry::whereNull('category_id')
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->where('direction', Direction::Out->value)
            ->whereNotIn('source_type', ['fund_transfer', 'bank_deposit'])
            ->where(function ($q) {
                $q->whereNull('description')
                    ->orWhere('description', 'not like', '%Penutupan Acara%');
            })
            ->sum('amount');
        if ($uncategorizedOut > 0) {
            $expenseByCategory[] = [
                'category_id' => null,
                'category_name' => 'Pengeluaran Lain-lain',
                'total' => $uncategorizedOut,
                'by_fund' => [],
            ];
            $totalExpense += $uncategorizedOut;
        }

        // 4. PEMINDAHAN ANTAR-DANA (Fund Transfers in period)
        $transfersByFund = [];
        foreach ($funds as $fund) {
            $tfIn = (int) LedgerEntry::where('fund_id', $fund->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::In->value)
                ->where(function ($q) {
                    $q->where('source_type', 'fund_transfer')
                        ->orWhere(function ($sq) {
                            $sq->whereNull('category_id')->where('description', 'like', '%Penutupan Acara%');
                        });
                })
                ->sum('amount');

            $tfOut = (int) LedgerEntry::where('fund_id', $fund->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::Out->value)
                ->where(function ($q) {
                    $q->where('source_type', 'fund_transfer')
                        ->orWhere(function ($sq) {
                            $sq->whereNull('category_id')->where('description', 'like', '%Penutupan Acara%');
                        });
                })
                ->sum('amount');

            $netTf = $tfIn - $tfOut;

            $transfersByFund[] = [
                'fund_id' => $fund->id,
                'fund_name' => $fund->name,
                'in_amount' => $tfIn,
                'out_amount' => $tfOut,
                'net_transfer' => $netTf,
            ];
        }

        // 5. SALDO AKHIR (entry_date <= $endDate)
        $closingBalancesByFund = [];
        $totalClosingFund = 0;
        foreach ($funds as $fund) {
            $inAll = (int) LedgerEntry::where('fund_id', $fund->id)
                ->where('entry_date', '<=', $endDate)
                ->where('direction', Direction::In->value)
                ->sum('amount');
            $outAll = (int) LedgerEntry::where('fund_id', $fund->id)
                ->where('entry_date', '<=', $endDate)
                ->where('direction', Direction::Out->value)
                ->sum('amount');
            $closing = $inAll - $outAll;

            // Fund movements in this period
            $fundOpening = collect($openingBalancesByFund)->firstWhere('fund_id', $fund->id)['balance'] ?? 0;
            $fundTf = collect($transfersByFund)->firstWhere('fund_id', $fund->id)['net_transfer'] ?? 0;

            // Fund income in period
            $fundIncome = (int) LedgerEntry::where('fund_id', $fund->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::In->value)
                ->whereNotNull('category_id')
                ->sum('amount')
                - (int) LedgerEntry::where('fund_id', $fund->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::Out->value)
                ->whereNotNull('category_id')
                ->whereHas('category', fn ($q) => $q->where('direction', Direction::In->value))
                ->sum('amount');

            // Fund expense in period
            $fundExpense = (int) LedgerEntry::where('fund_id', $fund->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::Out->value)
                ->whereNotNull('category_id')
                ->sum('amount')
                - (int) LedgerEntry::where('fund_id', $fund->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::In->value)
                ->whereNotNull('category_id')
                ->whereHas('category', fn ($q) => $q->where('direction', Direction::Out->value))
                ->sum('amount');

            $closingBalancesByFund[] = [
                'fund_id' => $fund->id,
                'fund_code' => $fund->code,
                'fund_name' => $fund->name,
                'opening_balance' => $fundOpening,
                'income' => $fundIncome,
                'expense' => $fundExpense,
                'net_transfer' => $fundTf,
                'closing_balance' => $closing,
            ];
            $totalClosingFund += $closing;
        }

        $closingBalancesByAccount = [];
        $totalClosingAccount = 0;
        foreach ($accounts as $account) {
            $inAll = (int) LedgerEntry::where('account_id', $account->id)
                ->where('entry_date', '<=', $endDate)
                ->where('direction', Direction::In->value)
                ->sum('amount');
            $outAll = (int) LedgerEntry::where('account_id', $account->id)
                ->where('entry_date', '<=', $endDate)
                ->where('direction', Direction::Out->value)
                ->sum('amount');
            $closing = $inAll - $outAll;

            $accountOpening = collect($openingBalancesByAccount)->firstWhere('account_id', $account->id)['balance'] ?? 0;
            $accountInPeriod = (int) LedgerEntry::where('account_id', $account->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::In->value)
                ->sum('amount');
            $accountOutPeriod = (int) LedgerEntry::where('account_id', $account->id)
                ->whereBetween('entry_date', [$startDate, $endDate])
                ->where('direction', Direction::Out->value)
                ->sum('amount');

            $closingBalancesByAccount[] = [
                'account_id' => $account->id,
                'account_code' => $account->code,
                'account_name' => $account->name,
                'account_type' => $account->type->value ?? 'cash',
                'opening_balance' => $accountOpening,
                'in_amount' => $accountInPeriod,
                'out_amount' => $accountOutPeriod,
                'closing_balance' => $closing,
            ];
            $totalClosingAccount += $closing;
        }

        $cStart = Carbon::parse($startDate);
        $cEnd = Carbon::parse($endDate);

        return [
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'formatted' => $cStart->translatedFormat('d M Y').' - '.$cEnd->translatedFormat('d M Y'),
            ],
            'opening_balances' => [
                'by_fund' => $openingBalancesByFund,
                'by_account' => $openingBalancesByAccount,
                'total' => $totalOpeningFund,
            ],
            'incomes' => [
                'by_category' => $incomeByCategory,
                'total' => $totalIncome,
            ],
            'expenses' => [
                'by_category' => $expenseByCategory,
                'total' => $totalExpense,
            ],
            'transfers' => [
                'by_fund' => $transfersByFund,
                'total_net' => 0,
            ],
            'closing_balances' => [
                'by_fund' => $closingBalancesByFund,
                'by_account' => $closingBalancesByAccount,
                'total' => $totalClosingFund,
            ],
            'summary' => [
                'total_opening' => $totalOpeningFund,
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'net_change' => $totalIncome - $totalExpense,
                'total_closing' => $totalClosingFund,
            ],
        ];
    }
}
