<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FundRequest;
use App\Models\Fund;
use Illuminate\Http\RedirectResponse;
use App\Models\LedgerEntry;
use App\Models\AllocationRuleItem;
use Inertia\Inertia;
use Inertia\Response;

class FundController extends Controller
{
    public function index(): Response
    {
        $funds = Fund::query()
            ->orderBy('code')
            ->paginate(25);

        return Inertia::render('admin/funds/index', [
            'funds' => $funds,
        ]);
    }

    public function show(Fund $fund): Response
    {
        $perAccount = LedgerEntry::query()
            ->join('accounts', 'accounts.id', '=', 'ledger_entries.account_id')
            ->where('ledger_entries.fund_id', $fund->id)
            ->groupBy('accounts.id', 'accounts.code', 'accounts.name')
            ->orderBy('accounts.code')
            ->selectRaw("accounts.id, accounts.code, accounts.name, SUM(CASE WHEN ledger_entries.direction = 'in' THEN ledger_entries.amount ELSE -ledger_entries.amount END) as balance")
            ->get()
            ->map(fn ($r) => ['id' => $r->id, 'code' => $r->code, 'name' => $r->name, 'balance' => (int) $r->balance]);

        $entries = LedgerEntry::query()
            ->with('account:id,name')
            ->where('fund_id', $fund->id)
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
                'account_name' => $e->account?->name,
            ]);

        $rules = AllocationRuleItem::query()
            ->with('allocationRule.category:id,name')
            ->where('fund_id', $fund->id)
            ->get()
            ->filter(fn ($item) => $item->allocationRule !== null)
            ->sortByDesc(fn ($item) => $item->allocationRule->valid_from)
            ->values()
            ->map(fn ($item) => [
                'id' => $item->id,
                'rule_id' => $item->allocation_rule_id,
                'rule_name' => $item->allocationRule->name,
                'category_name' => $item->allocationRule->category?->name,
                'percentage' => $item->percentage,
                'valid_from' => $item->allocationRule->valid_from->toDateString(),
                'is_active' => $item->allocationRule->is_active,
            ]);

        return Inertia::render('admin/funds/show', [
            'fund' => [
                'id' => $fund->id,
                'code' => $fund->code,
                'name' => $fund->name,
                'description' => $fund->description,
                'is_active' => $fund->is_active,
            ],
            'balance' => LedgerEntry::getBalance($fund->id),
            'perAccount' => $perAccount,
            'entries' => $entries,
            'rules' => $rules,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/funds/form', [
            'fund' => null,
        ]);
    }

    public function store(FundRequest $request): RedirectResponse
    {
        Fund::create($request->validated());

        return redirect()->route('admin.funds.index')->with('success', 'Dana berhasil ditambahkan.');
    }

    public function edit(Fund $fund): Response
    {
        return Inertia::render('admin/funds/form', [
            'fund' => $fund,
        ]);
    }

    public function update(FundRequest $request, Fund $fund): RedirectResponse
    {
        $fund->update($request->validated());

        return redirect()->route('admin.funds.index')->with('success', 'Dana berhasil diperbarui.');
    }

    public function toggle(Fund $fund): RedirectResponse
    {
        $fund->update(['is_active' => ! $fund->is_active]);

        return redirect()->back()->with('success', 'Status dana berhasil diubah.');
    }
}
