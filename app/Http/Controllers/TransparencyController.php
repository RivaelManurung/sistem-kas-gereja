<?php

namespace App\Http\Controllers;

use App\Enums\Direction;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Fund;
use App\Models\LedgerEntry;
use Illuminate\Http\Request;
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

        // 1. Public Categories (Strictly filtered by is_public = true)
        $publicIncomeCategories = Category::where('is_public', true)
            ->where('is_active', true)
            ->where('direction', Direction::In->value)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $publicExpenseCategories = Category::where('is_public', true)
            ->where('is_active', true)
            ->where('direction', Direction::Out->value)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $incomeByCategory = $publicIncomeCategories->map(function (Category $category) {
            $amount = (int) LedgerEntry::where('category_id', $category->id)
                ->where('direction', Direction::In->value)
                ->sum('amount');

            return [
                'id' => $category->id,
                'name' => $category->name,
                'amount' => $amount,
            ];
        })->values()->all();

        $expenseByCategory = $publicExpenseCategories->map(function (Category $category) {
            $amount = (int) LedgerEntry::where('category_id', $category->id)
                ->where('direction', Direction::Out->value)
                ->sum('amount');

            return [
                'id' => $category->id,
                'name' => $category->name,
                'amount' => $amount,
            ];
        })->values()->all();

        // 2. Active Fund Balances
        $funds = Fund::where('is_active', true)->orderBy('code')->get();
        $fundBalances = $funds->map(function (Fund $fund) {
            return [
                'id' => $fund->id,
                'code' => $fund->code,
                'name' => $fund->name,
                'balance' => LedgerEntry::getBalance($fund->id),
            ];
        })->values()->all();

        $totalIncome = array_sum(array_column($incomeByCategory, 'amount'));
        $totalExpense = array_sum(array_column($expenseByCategory, 'amount'));
        $totalBalance = array_sum(array_column($fundBalances, 'balance'));

        // 3. Monthly Trend (Past 6 months, only for public categories)
        $publicIncomeIds = $publicIncomeCategories->pluck('id')->all();
        $publicExpenseIds = $publicExpenseCategories->pluck('id')->all();

        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $mStart = $monthDate->copy()->startOfMonth()->toDateString();
            $mEnd = $monthDate->copy()->endOfMonth()->toDateString();

            $income = ! empty($publicIncomeIds)
                ? (int) LedgerEntry::where('direction', Direction::In->value)
                    ->whereIn('category_id', $publicIncomeIds)
                    ->whereBetween('entry_date', [$mStart, $mEnd])
                    ->sum('amount')
                : 0;

            $expense = ! empty($publicExpenseIds)
                ? (int) LedgerEntry::where('direction', Direction::Out->value)
                    ->whereIn('category_id', $publicExpenseIds)
                    ->whereBetween('entry_date', [$mStart, $mEnd])
                    ->sum('amount')
                : 0;

            $monthlyTrend[] = [
                'month' => $monthDate->format('Y-m'),
                'label' => $monthDate->translatedFormat('M Y'),
                'income' => $income,
                'expense' => $expense,
                'net' => $income - $expense,
            ];
        }

        return Inertia::render('transparency/index', [
            'churchName' => $setting->name ?? 'Gereja',
            'fundBalances' => $fundBalances,
            'incomeByCategory' => $incomeByCategory,
            'expenseByCategory' => $expenseByCategory,
            'monthlyTrend' => $monthlyTrend,
            'summary' => [
                'totalBalance' => $totalBalance,
                'totalIncome' => $totalIncome,
                'totalExpense' => $totalExpense,
            ],
        ]);
    }
}
