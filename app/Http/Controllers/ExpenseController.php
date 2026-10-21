<?php

namespace App\Http\Controllers;

use App\Enums\Direction;
use App\Enums\ExpenseStatus;
use App\Enums\Role;
use App\Http\Requests\ExpenseRequest;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Services\ExpenseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $expenses = Expense::query()
            ->with(['account', 'fund', 'category', 'submitter', 'approver'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('fund_id'), fn ($q, $fundId) => $q->where('fund_id', $fundId))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $funds = Fund::active()->orderBy('name')->get();
        $setting = ChurchSetting::current();

        return Inertia::render('expenses/index', [
            'expenses' => $expenses,
            'funds' => $funds,
            'filters' => $request->only(['status', 'fund_id']),
            'threshold' => $setting->expense_approval_threshold,
        ]);
    }

    public function create(): Response
    {
        $accounts = Account::active()->orderBy('name')->get();
        $funds = Fund::active()->orderBy('name')->get();
        $categories = Category::active()
            ->where('direction', Direction::Out)
            ->orderBy('name')
            ->get();

        return Inertia::render('expenses/create', [
            'accounts' => $accounts,
            'funds' => $funds,
            'categories' => $categories,
            'today' => now()->toDateString(),
        ]);
    }

    public function store(ExpenseRequest $request, ExpenseService $expenseService): RedirectResponse
    {
        $expense = $expenseService->submit(
            $request->validated(),
            $request->user(),
            $request->file('proof')
        );

        return redirect()->route('expenses.show', $expense)
            ->with('success', "Pengajuan pengeluaran {$expense->expense_number} berhasil dibuat.");
    }

    public function show(Expense $expense): Response
    {
        $expense->load(['account', 'fund', 'category', 'submitter', 'approver']);
        $fundBalance = LedgerEntry::getBalance($expense->fund_id);
        $setting = ChurchSetting::current();

        $user = auth()->user();
        $isSubmitter = $user && $expense->submitted_by === $user->id;
        $isMajelisOrAdmin = $user && $user->hasAnyRole([Role::Majelis->value, Role::Admin->value]);
        $isBendaharaOrAdmin = $user && $user->hasAnyRole([Role::Bendahara->value, Role::Admin->value]);
        $needsMajelis = $setting->expense_approval_threshold > 0 && $expense->amount > $setting->expense_approval_threshold;

        $canApprove = ! $isSubmitter && $expense->status === ExpenseStatus::Pending && ($needsMajelis ? $isMajelisOrAdmin : ($isBendaharaOrAdmin || $isMajelisOrAdmin));
        $canPay = $expense->status === ExpenseStatus::Approved && $isBendaharaOrAdmin;

        return Inertia::render('expenses/show', [
            'expense' => $expense,
            'fundBalance' => $fundBalance,
            'setting' => $setting,
            'canApprove' => $canApprove,
            'canPay' => $canPay,
            'needsMajelis' => $needsMajelis,
        ]);
    }

    public function approveView(Expense $expense): Response
    {
        $expense->load(['account', 'fund', 'category', 'submitter', 'approver']);
        $fundBalance = LedgerEntry::getBalance($expense->fund_id);
        $setting = ChurchSetting::current();

        $user = auth()->user();
        $isSubmitter = $user && $expense->submitted_by === $user->id;
        $isMajelisOrAdmin = $user && $user->hasAnyRole([Role::Majelis->value, Role::Admin->value]);
        $isBendaharaOrAdmin = $user && $user->hasAnyRole([Role::Bendahara->value, Role::Admin->value]);
        $needsMajelis = $setting->expense_approval_threshold > 0 && $expense->amount > $setting->expense_approval_threshold;

        $canApprove = ! $isSubmitter && $expense->status === ExpenseStatus::Pending && ($needsMajelis ? $isMajelisOrAdmin : ($isBendaharaOrAdmin || $isMajelisOrAdmin));

        return Inertia::render('expenses/approve', [
            'expense' => $expense,
            'fundBalance' => $fundBalance,
            'setting' => $setting,
            'canApprove' => $canApprove,
            'needsMajelis' => $needsMajelis,
        ]);
    }

    public function approve(Request $request, Expense $expense, ExpenseService $expenseService): RedirectResponse
    {
        $expenseService->approve($expense, $request->user(), $request->input('notes'));

        return redirect()->route('expenses.show', $expense)
            ->with('success', "Pengeluaran {$expense->expense_number} berhasil disetujui.");
    }

    public function reject(Request $request, Expense $expense, ExpenseService $expenseService): RedirectResponse
    {
        $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ], [
            'notes.required' => 'Alasan penolakan pengeluaran wajib diisi.',
        ]);

        $expenseService->reject($expense, $request->user(), $request->input('notes'));

        return redirect()->route('expenses.show', $expense)
            ->with('success', "Pengeluaran {$expense->expense_number} telah ditolak.");
    }

    public function pay(Request $request, Expense $expense, ExpenseService $expenseService): RedirectResponse
    {
        $expenseService->pay($expense, $request->user());

        return redirect()->route('expenses.show', $expense)
            ->with('success', "Pengeluaran {$expense->expense_number} berhasil dibayarkan dan dibukukan ke buku besar.");
    }
}
