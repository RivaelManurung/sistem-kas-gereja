<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FundRequest;
use App\Models\Fund;
use Illuminate\Http\RedirectResponse;
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
