<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccountType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AccountRequest;
use App\Models\Account;
use Illuminate\Http\RedirectResponse;
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
