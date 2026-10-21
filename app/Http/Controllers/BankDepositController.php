<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
use App\Enums\Direction;
use App\Http\Requests\BankDepositRequest;
use App\Models\Account;
use App\Models\BankDeposit;
use App\Models\Fund;
use App\Models\LedgerEntry;
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

    public function show(BankDeposit $deposit): Response
    {
        $deposit->load(['fromAccount', 'toAccount', 'creator']);

        $entries = LedgerEntry::query()
            ->with(['account', 'fund'])
            ->where('source_type', 'bank_deposit')
            ->where('source_id', $deposit->id)
            ->orderBy('id')
            ->get();

        return Inertia::render('deposits/show', [
            'deposit' => $deposit,
            'ledgerEntries' => $entries,
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

        // Idempotency check: if key provided and already processed, return existing
        if (! empty($data['idempotency_key'])) {
            $existing = BankDeposit::where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) {
                return redirect()->route('deposits.index')
                    ->with('success', 'Setoran bank berhasil dibukukan.');
            }
        }

        DB::transaction(function () use ($data, $user, $ledgerService) {
            // Lock source and destination accounts
            Account::where('id', $data['from_account_id'])->lockForUpdate()->first();
            Account::where('id', $data['to_account_id'])->lockForUpdate()->first();

            // Account balance check on source cash account
            $setting = \App\Models\ChurchSetting::current();
            $sourceBalance = LedgerEntry::getAccountBalance($data['from_account_id']);
            if ($sourceBalance < $data['amount'] && ! $setting->allow_negative_balance) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'amount' => 'Saldo rekening kas sumber tidak mencukupi untuk setoran bank ini.',
                ]);
            }

            $deposit = BankDeposit::create([
                ...$data,
                'status' => 'completed',
                'created_by' => $user->id,
            ]);

            // General fund is used for account balance transfer
            $fund = Fund::where('code', 'UMUM')->first() ?? Fund::first();
            if (! $fund) {
                $fund = Fund::create([
                    'code' => 'UMUM',
                    'name' => 'Dana Umum',
                    'type' => 'unrestricted',
                    'is_active' => true,
                ]);
            }
            $fundId = $fund->id;
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
