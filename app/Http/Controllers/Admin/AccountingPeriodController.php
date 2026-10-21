<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AccountingPeriodRequest;
use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\Fund;
use App\Services\AccountingPeriodService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AccountingPeriodController extends Controller
{
    public function index(Request $request): Response
    {
        $periods = AccountingPeriod::query()
            ->with(['closer'])
            ->orderByDesc('start_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/periods/index', [
            'periods' => $periods,
        ]);
    }

    public function create(): Response
    {
        $accounts = Account::active()->orderBy('name')->get();
        $funds = Fund::active()->orderBy('name')->get();

        return Inertia::render('admin/periods/form', [
            'accounts' => $accounts,
            'funds' => $funds,
            'today' => now()->toDateString(),
        ]);
    }

    public function store(AccountingPeriodRequest $request, AccountingPeriodService $periodService): RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();

        DB::transaction(function () use ($data, $user, $periodService, $request) {
            $period = AccountingPeriod::create([
                'name' => $data['name'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
            ]);

            if (! empty($data['opening_balances'])) {
                foreach ($data['opening_balances'] as $bal) {
                    if ((int) ($bal['amount'] ?? 0) > 0) {
                        $periodService->recordOpeningBalance($period, [
                            'account_id' => $bal['account_id'],
                            'fund_id' => $bal['fund_id'],
                            'amount' => (int) $bal['amount'],
                            'date' => $data['start_date'],
                            'description' => "Saldo Awal {$period->name}",
                        ]);
                    }
                }
            }

            if ($request->boolean('close_immediately')) {
                $periodService->close($period, $user);
            }
        });

        return redirect()->route('admin.periods.index')
            ->with('success', 'Periode akuntansi berhasil disimpan.');
    }

    public function close(AccountingPeriod $period, Request $request, AccountingPeriodService $periodService): RedirectResponse
    {
        $periodService->close($period, $request->user());

        return redirect()->route('admin.periods.index')
            ->with('success', "Periode akuntansi '{$period->name}' berhasil ditutup.");
    }
}
