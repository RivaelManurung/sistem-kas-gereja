<?php

namespace App\Http\Controllers;

use App\Enums\Direction;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\FrozenReport;
use App\Models\Fund;
use App\Models\LedgerEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransparencyController extends Controller
{
    public function index(Request $request): Response
    {
        $setting = ChurchSetting::current();

        if (! $setting->public_page_enabled) {
            abort(404, 'Halaman transparansi publik sedang dinonaktifkan.');
        }

        $currentYear = (int) now()->format('Y');
        $filters = $request->validate([
            'tahun' => ['nullable', 'integer', 'between:2000,'.($currentYear + 1)],
            'periode' => ['nullable', 'regex:/^(all|s[12]|q[1-4]|m(0[1-9]|1[0-2]))$/'],
        ]);
        $year = (int) ($filters['tahun'] ?? $currentYear);
        $period = $filters['periode'] ?? 'all';

        [$firstMonth, $lastMonthOfRange] = match (true) {
            $period === 's1' => [1, 6],
            $period === 's2' => [7, 12],
            (bool) preg_match('/^q([1-4])$/', $period, $m) => [($m[1] - 1) * 3 + 1, $m[1] * 3],
            (bool) preg_match('/^m(\d{2})$/', $period, $m) => [(int) $m[1], (int) $m[1]],
            default => [1, 12],
        };
        $from = now()->setDate($year, $firstMonth, 1)->startOfMonth()->toDateString();
        $to = now()->setDate($year, $lastMonthOfRange, 1)->endOfMonth()->toDateString();
        $periodLabel = $firstMonth === $lastMonthOfRange
            ? now()->setDate($year, $firstMonth, 1)->translatedFormat('F Y')
            : ($period === 'all'
                ? "Januari - Desember {$year}"
                : now()->setDate($year, $firstMonth, 1)->translatedFormat('F').' - '.now()->setDate($year, $lastMonthOfRange, 1)->translatedFormat('F')." {$year}");

        $publicCategories = Category::where('is_public', true)->where('is_active', true)->orderBy('sort_order')->orderBy('name')->get();

        // Satu query untuk total per kategori pada rentang terpilih.
        $totals = LedgerEntry::query()
            ->whereIn('category_id', $publicCategories->pluck('id'))
            ->whereBetween('entry_date', [$from, $to])
            ->groupBy('category_id', 'direction')
            ->selectRaw('category_id, direction, sum(amount) as total')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->category_id.'|'.($row->direction instanceof Direction ? $row->direction->value : $row->direction) => (int) $row->total]);

        $byDirection = fn (Direction $direction) => $publicCategories
            ->where('direction', $direction)
            ->map(fn (Category $category) => ['id' => $category->id, 'name' => $category->name, 'amount' => $totals[$category->id.'|'.$direction->value] ?? 0])
            ->values();

        $incomeByCategory = $byDirection(Direction::In);
        $expenseByCategory = $byDirection(Direction::Out);

        // Dana acara digabung satu baris agar halaman publik tidak menampilkan kode internal.
        $funds = Fund::where('is_active', true)->orderBy('name')->get();
        $balances = LedgerEntry::query()
            ->whereIn('fund_id', $funds->pluck('id'))
            ->groupBy('fund_id')
            ->selectRaw("fund_id, sum(case when direction = 'in' then amount else -amount end) as balance")
            ->pluck('balance', 'fund_id');

        $fundBalances = $funds->whereNull('event_id')->map(fn (Fund $fund) => [
            'id' => $fund->id,
            'name' => $fund->name,
            'description' => $fund->description,
            'balance' => (int) ($balances[$fund->id] ?? 0),
        ])->values()->all();

        $eventFunds = $funds->whereNotNull('event_id');
        if ($eventFunds->isNotEmpty()) {
            $fundBalances[] = ['id' => 0, 'name' => 'Dana acara berjalan', 'description' => 'Dana yang dikumpulkan dan dipakai khusus untuk acara dan kepanitiaan.', 'balance' => (int) $eventFunds->sum(fn (Fund $f) => $balances[$f->id] ?? 0)];
        }

        $lastMonth = $year === $currentYear ? min($lastMonthOfRange, (int) now()->format('n')) : $lastMonthOfRange;
        $perMonth = LedgerEntry::query()
            ->whereIn('category_id', $publicCategories->pluck('id'))
            ->whereBetween('entry_date', [$from, $to])
            ->groupByRaw("extract(month from entry_date), direction")
            ->selectRaw('extract(month from entry_date)::int as m, direction, sum(amount) as total')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->m.'|'.($row->direction instanceof Direction ? $row->direction->value : $row->direction) => (int) $row->total]);

        $monthlyTrend = [];
        for ($m = $firstMonth; $m <= $lastMonth; $m++) {
            $date = now()->setDate($year, $m, 1);
            $income = $perMonth[$m.'|in'] ?? 0;
            $expense = $perMonth[$m.'|out'] ?? 0;

            $monthlyTrend[] = [
                'month' => $date->format('Y-m'),
                'label' => $date->translatedFormat('M Y'),
                'income' => $income,
                'expense' => $expense,
                'net' => $income - $expense,
            ];
        }

        $years = LedgerEntry::query()
            ->select(DB::raw('distinct extract(year from entry_date)::int as y'))
            ->orderByDesc('y')
            ->pluck('y')
            ->map(fn ($y) => (int) $y)
            ->whenEmpty(fn ($c) => $c->push($currentYear))
            ->values()
            ->all();

        $reports = FrozenReport::query()
            ->where('status', FrozenReport::STATUS_APPROVED)
            ->whereBetween('start_date', [$from, $to])
            ->orderByDesc('start_date')
            ->get(['title', 'start_date', 'end_date', 'verification_code'])
            ->map(fn (FrozenReport $r) => [
                'title' => $r->title,
                'period' => $r->start_date->translatedFormat('F Y'),
                'code' => $r->verification_code,
            ])
            ->values()
            ->all();

        return Inertia::render('transparency/index', [
            'churchName' => $setting->name ?? 'Gereja',
            'church' => ['address' => $setting->address, 'city' => $setting->city, 'phone' => $setting->phone, 'email' => $setting->email],
            'year' => $year,
            'period' => $period,
            'periodLabel' => $periodLabel,
            'years' => $years,
            'fundBalances' => $fundBalances,
            'incomeByCategory' => $incomeByCategory->all(),
            'expenseByCategory' => $expenseByCategory->all(),
            'monthlyTrend' => $monthlyTrend,
            'reports' => $reports,
            'summary' => [
                'totalBalance' => array_sum(array_column($fundBalances, 'balance')),
                'totalIncome' => (int) $incomeByCategory->sum('amount'),
                'totalExpense' => (int) $expenseByCategory->sum('amount'),
            ],
        ]);
    }
}
