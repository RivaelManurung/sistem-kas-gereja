<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccountType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AccountRequest;
use App\Models\Account;
use Illuminate\Http\RedirectResponse;
use App\Models\LedgerEntry;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(): Response
    {
        $accounts = Account::query()
            ->orderBy('code')
            ->paginate(25);

        return Inertia::render('admin/accounts/index', [
            'accounts' => $accounts,
        ]);
    }

    public function show(Account $account): Response
    {
        $perFund = LedgerEntry::query()
            ->join('funds', 'funds.id', '=', 'ledger_entries.fund_id')
            ->where('ledger_entries.account_id', $account->id)
            ->groupBy('funds.id', 'funds.code', 'funds.name')
            ->orderBy('funds.code')
            ->selectRaw("funds.id, funds.code, funds.name, SUM(CASE WHEN ledger_entries.direction = 'in' THEN ledger_entries.amount ELSE -ledger_entries.amount END) as balance")
            ->get()
            ->map(fn ($r) => ['id' => $r->id, 'code' => $r->code, 'name' => $r->name, 'balance' => (int) $r->balance]);

        $entries = LedgerEntry::query()
            ->with('fund:id,name')
            ->where('account_id', $account->id)
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->limit(15)
            ->get()
            ->map(fn (LedgerEntry $e) => [
                'id' => $e->id,
                'entry_date' => $e->entry_date->toDateString(),
                'description' => $e->description,
                'direction' => $e->direction->value,
                'amount' => $e->amount,
                'source_url' => $e->source_url,
                'fund_name' => $e->fund?->name,
            ]);

        return Inertia::render('admin/accounts/show', [
            'account' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type->value,
                'type_label' => $account->type->label(),
                'bank_name' => $account->bank_name,
                'account_number' => $account->account_number,
                'is_active' => $account->is_active,
            ],
            'balance' => LedgerEntry::getAccountBalance($account->id),
            'perFund' => $perFund,
            'entries' => $entries,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/accounts/form', [
            'account' => null,
            'typeOptions' => array_map(
                fn (AccountType $t) => ['value' => $t->value, 'label' => $t->label()],
                AccountType::cases()
            ),
        ]);
    }

    public function store(AccountRequest $request): RedirectResponse
    {
        Account::create($request->validated());

        return redirect()->route('admin.accounts.index')->with('success', 'Rekening berhasil ditambahkan.');
    }

    public function edit(Account $account): Response
    {
        return Inertia::render('admin/accounts/form', [
            'account' => $account,
            'typeOptions' => array_map(
                fn (AccountType $t) => ['value' => $t->value, 'label' => $t->label()],
                AccountType::cases()
            ),
        ]);
    }

    public function update(AccountRequest $request, Account $account): RedirectResponse
    {
        $account->update($request->validated());

        return redirect()->route('admin.accounts.index')->with('success', 'Rekening berhasil diperbarui.');
    }

    public function toggle(Account $account): RedirectResponse
    {
        $account->update(['is_active' => ! $account->is_active]);

        return redirect()->back()->with('success', 'Status rekening berhasil diubah.');
    }
}
