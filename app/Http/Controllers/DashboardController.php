<?php

namespace App\Http\Controllers;

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\ExpenseStatus;
use App\Models\Account;
use App\Models\ChurchSetting;
use App\Models\CountSheet;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\ServiceSession;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $setting = ChurchSetting::current();

        // 1. Current Balances per Fund
        $funds = Fund::where('is_active', true)->orderBy('code')->get();
        $fundBalances = $funds->map(function (Fund $fund) {
            return [
                'id' => $fund->id,
                'code' => $fund->code,
                'name' => $fund->name,
                'balance' => LedgerEntry::getBalance($fund->id),
            ];
        })->values()->all();

        // 2. Current Balances per Account
        $accounts = Account::where('is_active', true)->orderBy('code')->get();
        $accountBalances = $accounts->map(function (Account $account) {
            return [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'bank_name' => $account->bank_name,
                'balance' => LedgerEntry::getAccountBalance($account->id),
            ];
        })->values()->all();

        $totalBalance = array_sum(array_column($accountBalances, 'balance'));

        // 3. This Month Income & Expenses
        $startOfMonth = now()->startOfMonth()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();

        $thisMonthIncome = (int) LedgerEntry::where('direction', Direction::In->value)
            ->whereBetween('entry_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $thisMonthExpense = (int) LedgerEntry::where('direction', Direction::Out->value)
            ->whereBetween('entry_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        // 4. Monthly Trend (Past 6 months)
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $mStart = $monthDate->copy()->startOfMonth()->toDateString();
            $mEnd = $monthDate->copy()->endOfMonth()->toDateString();

            $income = (int) LedgerEntry::where('direction', Direction::In->value)
                ->whereBetween('entry_date', [$mStart, $mEnd])
                ->sum('amount');

            $expense = (int) LedgerEntry::where('direction', Direction::Out->value)
                ->whereBetween('entry_date', [$mStart, $mEnd])
                ->sum('amount');

            $monthlyTrend[] = [
                'month' => $monthDate->format('Y-m'),
                'label' => $monthDate->translatedFormat('M Y'),
                'income' => $income,
                'expense' => $expense,
                'net' => $income - $expense,
            ];
        }

        // 5. Actionable Alerts
        // A. Count sheets waiting confirmation
        $draftSheets = CountSheet::with(['serviceSession', 'event', 'confirmations'])
            ->where('status', CountSheetStatus::Draft)
            ->orderByDesc('date')
            ->get();

        $waitingConfirmationCountSheets = $draftSheets->map(function (CountSheet $sheet) use ($setting) {
            $required = match ($sheet->type) {
                CountSheetType::Service => $setting->min_confirmations_service,
                CountSheetType::Event => $setting->min_confirmations_event,
                default => $setting->min_confirmations_general,
            };

            return [
                'id' => $sheet->id,
                'date' => $sheet->date?->format('Y-m-d'),
                'type' => $sheet->type->value,
                'type_label' => $sheet->type->label(),
                'total_amount' => $sheet->total_amount,
                'session_name' => $sheet->serviceSession?->name ?? $sheet->event?->name ?? 'Penerimaan Umum',
                'confirmations_count' => $sheet->confirmations->count(),
                'required_confirmations' => $required,
            ];
        })->values()->all();

        // B. Count sheets waiting verification
        $confirmedSheets = CountSheet::with(['serviceSession', 'event'])
            ->where('status', CountSheetStatus::Confirmed)
            ->orderByDesc('date')
            ->get();

        $waitingVerificationCountSheets = $confirmedSheets->map(function (CountSheet $sheet) {
            return [
                'id' => $sheet->id,
                'date' => $sheet->date?->format('Y-m-d'),
                'type' => $sheet->type->value,
                'type_label' => $sheet->type->label(),
                'total_amount' => $sheet->total_amount,
                'session_name' => $sheet->serviceSession?->name ?? $sheet->event?->name ?? 'Penerimaan Umum',
            ];
        })->values()->all();

        // C. Expenses waiting approval
        $pendingExpenses = Expense::with(['fund', 'category', 'submitter'])
            ->where('status', ExpenseStatus::Pending)
            ->orderByDesc('date')
            ->get();

        $waitingApprovalExpenses = $pendingExpenses->map(function (Expense $expense) use ($setting) {
            $isAboveThreshold = $expense->amount > $setting->expense_approval_threshold;

            return [
                'id' => $expense->id,
                'expense_number' => $expense->expense_number,
                'payee' => $expense->payee,
                'amount' => $expense->amount,
                'date' => $expense->date?->format('Y-m-d'),
                'fund_name' => $expense->fund?->name,
                'category_name' => $expense->category?->name,
                'description' => $expense->description,
                'is_above_threshold' => $isAboveThreshold,
                'submitter_name' => $expense->submitter?->name,
            ];
        })->values()->all();

        // D. Uncounted service sessions
        $uncountedSessions = ServiceSession::where('is_completed', false)
            ->whereDoesntHave('countSheets')
            ->orderByDesc('date')
            ->take(10)
            ->get()
            ->map(function (ServiceSession $session) {
                return [
                    'id' => $session->id,
                    'name' => $session->name,
                    'date' => $session->date?->format('Y-m-d'),
                ];
            })->values()->all();

        return Inertia::render('dashboard', [
            'fundBalances' => $fundBalances,
            'accountBalances' => $accountBalances,
            'monthlyTrend' => $monthlyTrend,
            'summary' => [
                'totalBalance' => $totalBalance,
                'thisMonthIncome' => $thisMonthIncome,
                'thisMonthExpense' => $thisMonthExpense,
            ],
            'alerts' => [
                'waitingConfirmationCountSheets' => $waitingConfirmationCountSheets,
                'waitingVerificationCountSheets' => $waitingVerificationCountSheets,
                'waitingApprovalExpenses' => $waitingApprovalExpenses,
                'uncountedSessions' => $uncountedSessions,
            ],
        ]);
    }
}
