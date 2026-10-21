<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
use App\Enums\Direction;
use App\Http\Requests\BankDepositRequest;
use App\Models\Account;
use App\Models\BankDeposit;
use App\Models\Fund;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BankDepositController extends Controller
{
    public function index(Request $request): Response
    {
        $deposits = BankDeposit::query()
            ->with(['fromAccount', 'toAccount', 'creator'])
            ->orderByDesc('deposit_date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('deposits/index', [
            'deposits' => $deposits,
        ]);
    }

    public function create(): Response
    {
        $cashAccounts = Account::active()->whereIn('type', [AccountType::Cash, AccountType::PettyCash])->orderBy('name')->get();
        $bankAccounts = Account::active()->where('type', AccountType::Bank)->orderBy('name')->get();

        return Inertia::render('deposits/form', [
            'cashAccounts' => $cashAccounts,
            'bankAccounts' => $bankAccounts,
            'today' => now()->toDateString(),
        ]);
    }

    public function store(BankDepositRequest $request, LedgerService $ledgerService): RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();

        DB::transaction(function () use ($data, $user, $ledgerService) {
            $deposit = BankDeposit::create([
                ...$data,
                'status' => 'completed',
                'created_by' => $user->id,
            ]);

            // General fund is used for account balance transfer
            $fund = Fund::where('code', 'UMUM')->first() ?? Fund::first();
            $fundId = $fund ? $fund->id : 1;
            $dateString = $deposit->deposit_date->toDateString();

            // 1. OUT from Cash
            $ledgerService->record([
                'entry_date' => $dateString,
                'account_id' => $deposit->from_account_id,
                'fund_id' => $fundId,
                'amount' => $deposit->amount,
                'direction' => Direction::Out,
                'description' => "Setoran Bank: Transfer keluar dari {$deposit->fromAccount->name} ke {$deposit->toAccount->name}" . ($deposit->reference_number ? " (Ref: {$deposit->reference_number})" : ''),
                'source_type' => 'bank_deposit',
                'source_id' => $deposit->id,
                'idempotency_key' => "dep-{$deposit->id}-out",
            ]);

            // 2. IN to Bank
            $ledgerService->record([
                'entry_date' => $dateString,
                'account_id' => $deposit->to_account_id,
                'fund_id' => $fundId,
                'amount' => $deposit->amount,
                'direction' => Direction::In,
                'description' => "Setoran Bank: Penerimaan masuk di {$deposit->toAccount->name} dari {$deposit->fromAccount->name}" . ($deposit->reference_number ? " (Ref: {$deposit->reference_number})" : ''),
                'source_type' => 'bank_deposit',
                'source_id' => $deposit->id,
                'idempotency_key' => "dep-{$deposit->id}-in",
            ]);
        });

        return redirect()->route('deposits.index')
            ->with('success', 'Setoran bank berhasil dibukukan.');
    }
}
