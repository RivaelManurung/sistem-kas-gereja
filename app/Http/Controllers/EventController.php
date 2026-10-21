<?php

namespace App\Http\Controllers;

use App\Enums\AttributeEntity;
use App\Enums\Direction;
use App\Enums\EventStatus;
use App\Http\Requests\EventRequest;
use App\Models\Account;
use App\Models\AttributeDefinition;
use App\Models\Event;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Event::query()
            ->with(['fund'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('search'), fn ($q, $search) => $q->where(function ($sub) use ($search) {
                $sub->where('name', 'ilike', "%{$search}%")
                    ->orWhere('theme', 'ilike', "%{$search}%");
            }))
            ->orderByDesc('start_date')
            ->orderByDesc('id');

        $events = $query->paginate(15)->withQueryString();

        // Attach financial metrics to each event
        $events->getCollection()->transform(function (Event $event) {
            $income = (int) LedgerEntry::where('fund_id', $event->fund_id)
                ->where('direction', Direction::In->value)
                ->sum('amount');
            $expense = (int) LedgerEntry::where('fund_id', $event->fund_id)
                ->where('direction', Direction::Out->value)
                ->sum('amount');
            $balance = $income - $expense;

            $event->financial_summary = [
                'target_budget' => $event->target_budget,
                'total_income' => $income,
                'total_expenses' => $expense,
                'remaining_balance' => $balance,
                'budget_realization_pct' => $event->target_budget > 0
                    ? round(($expense / $event->target_budget) * 100, 1)
                    : 0,
            ];

            return $event;
        });

        return Inertia::render('events/index', [
            'events' => $events,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function create(): Response
    {
        $attributeDefinitions = AttributeDefinition::active()
            ->where('entity_type', AttributeEntity::Event->value)
            ->whereNull('scope_event_id')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('events/create', [
            'event' => null,
            'attributeDefinitions' => $attributeDefinitions,
        ]);
    }

    public function store(EventRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $event = DB::transaction(function () use ($data) {
            $event = Event::create([
                'name' => $data['name'],
                'theme' => $data['theme'] ?? null,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?? null,
                'status' => $data['status'] ?? EventStatus::Planning->value,
                'target_budget' => $data['target_budget'] ?? 0,
                'description' => $data['description'] ?? null,
            ]);

            if (! empty($data['attributes'])) {
                $event->syncCustomAttributes($data['attributes']);
            }

            return $event;
        });

        return redirect()->route('events.show', $event)
            ->with('success', 'Acara berhasil dibuat.');
    }

    public function show(Event $event): Response
    {
        $event->load([
            'fund',
            'members.user',
            'members.member',
            'categories',
            'countSheets.creator',
            'countSheets.account',
        ]);

        $totalIncome = (int) LedgerEntry::where('fund_id', $event->fund_id)
            ->where('direction', Direction::In->value)
            ->sum('amount');
        $totalExpenses = (int) LedgerEntry::where('fund_id', $event->fund_id)
            ->where('direction', Direction::Out->value)
            ->sum('amount');
        $remainingBalance = $totalIncome - $totalExpenses;

        $financialSummary = [
            'target_budget' => $event->target_budget,
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpenses,
            'remaining_balance' => $remainingBalance,
            'budget_realization_pct' => $event->target_budget > 0
                ? round(($totalExpenses / $event->target_budget) * 100, 1)
                : 0,
        ];

        $expenseEntries = LedgerEntry::where('fund_id', $event->fund_id)
            ->where('direction', Direction::Out->value)
            ->with(['account', 'category'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->get();

        $accounts = Account::active()->orderBy('name')->get();
        $targetFunds = Fund::active()->where('id', '!=', $event->fund_id)->orderBy('name')->get();
        $users = User::where('is_active', true)->orderBy('name')->get();
        $members = Member::where('is_active', true)->orderBy('name')->get();

        $attributeDefinitions = AttributeDefinition::active()
            ->where('entity_type', AttributeEntity::Event->value)
            ->where(fn ($q) => $q->whereNull('scope_event_id')->orWhere('scope_event_id', $event->id))
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('events/show', [
            'event' => $event,
            'financialSummary' => $financialSummary,
            'expenseEntries' => $expenseEntries,
            'accounts' => $accounts,
            'targetFunds' => $targetFunds,
            'users' => $users,
            'members' => $members,
            'attributeDefinitions' => $attributeDefinitions,
            'customAttributes' => $event->customAttributes(),
        ]);
    }

    public function edit(Event $event): Response
    {
        $attributeDefinitions = AttributeDefinition::active()
            ->where('entity_type', AttributeEntity::Event->value)
            ->where(fn ($q) => $q->whereNull('scope_event_id')->orWhere('scope_event_id', $event->id))
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('events/form', [
            'event' => $event,
            'attributeDefinitions' => $attributeDefinitions,
            'customAttributes' => $event->customAttributes(),
        ]);
    }

    public function update(EventRequest $request, Event $event): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($event, $data) {
            $event->update([
                'name' => $data['name'],
                'theme' => $data['theme'] ?? null,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?? null,
                'status' => $data['status'] ?? $event->status->value,
                'target_budget' => $data['target_budget'] ?? 0,
                'description' => $data['description'] ?? null,
            ]);

            if (isset($data['attributes'])) {
                $event->syncCustomAttributes($data['attributes'], $event->id);
            }
        });

        return redirect()->route('events.show', $event)
            ->with('success', 'Informasi acara berhasil diperbarui.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        if ($event->isClosed()) {
            return redirect()->route('events.show', $event)
                ->with('error', 'Acara yang sudah ditutup tidak dapat dihapus.');
        }

        $hasLedgerEntries = LedgerEntry::where('fund_id', $event->fund_id)->exists();
        if ($hasLedgerEntries) {
            return redirect()->route('events.show', $event)
                ->with('error', 'Acara yang sudah memiliki transaksi keuangan tidak dapat dihapus.');
        }

        DB::transaction(function () use ($event) {
            $fund = $event->fund;
            $event->members()->delete();
            $event->categories()->delete();
            $event->delete();
            if ($fund) {
                $fund->delete();
            }
        });

        return redirect()->route('events.index')
            ->with('success', 'Acara berhasil dihapus.');
    }
}
