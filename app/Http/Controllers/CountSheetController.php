<?php

namespace App\Http\Controllers;

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Http\Requests\CountSheetRequest;
use App\Models\Account;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\CountSheet;
use App\Models\Event;
use App\Models\ServiceSession;
use App\Services\CountCalculationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class CountSheetController extends Controller
{
    public function __construct(
        protected CountCalculationService $calculationService
    ) {}

    public function index(Request $request): Response
    {
        $sheets = CountSheet::query()
            ->with(['serviceSession', 'event', 'account', 'creator', 'lines.category'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($request->query('event_id'), fn ($q, $eventId) => $q->where('event_id', $eventId))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('counting/index', [
            'sheets' => $sheets,
            'filters' => $request->only(['status', 'type', 'event_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        $sessionId = $request->query('session_id');
        $session = $sessionId ? ServiceSession::with('schedule')->find($sessionId) : null;
        $eventId = $request->query('event_id');
        $event = $eventId ? Event::find($eventId) : null;

        $type = $request->query('type');
        if (! $type) {
            if ($session) {
                $type = CountSheetType::Service->value;
            } elseif ($event) {
                $type = CountSheetType::Event->value;
            } else {
                $type = CountSheetType::General->value;
            }
        }

        $accounts = Account::active()->orderBy('name')->get();

        $categoriesQuery = Category::active()->where('direction', Direction::In);
        if ($type === CountSheetType::Event->value && $eventId) {
            $categoriesQuery->forEvent((int) $eventId);
        } else {
            $categoriesQuery->general();
        }
        $categories = $categoriesQuery->orderBy('name')->get();
        $setting = ChurchSetting::current();

        return Inertia::render('counting/form', [
            'sheet' => null,
            'session' => $session,
            'event' => $event,
            'type' => $type,
            'accounts' => $accounts,
            'categories' => $categories,
            'denominations' => $setting->cash_denominations ?? [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100],
            'today' => $session ? $session->date->toDateString() : now()->toDateString(),
        ]);
    }

    public function store(CountSheetRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $calculated = $this->calculationService->calculate($data['lines']);

        $sheet = DB::transaction(function () use ($data, $calculated, $request) {
            $sheet = CountSheet::create([
                'type' => $data['type'],
                'service_session_id' => $data['service_session_id'] ?? null,
                'event_id' => $data['event_id'] ?? null,
                'account_id' => $data['account_id'],
                'date' => $data['date'],
                'status' => CountSheetStatus::Draft,
                'total_amount' => $calculated['total_amount'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);

            foreach ($calculated['lines'] as $line) {
                $sheet->lines()->create($line);
            }

            return $sheet;
        });

        return redirect()->route('counting.show', $sheet)
            ->with('success', 'Berita acara penghitungan berhasil disimpan.');
    }

    public function show(CountSheet $counting): Response
    {
        $sheet = $counting->load([
            'serviceSession.schedule',
            'event',
            'account',
            'creator',
            'lines.category',
        ]);

        if (method_exists($sheet, 'confirmations')) {
            $sheet->load('confirmations.user');
        }
        if (method_exists($sheet, 'donations')) {
            $sheet->load('donations.member');
        }

        $setting = ChurchSetting::current();

        return Inertia::render('counting/show', [
            'sheet' => $sheet,
            'setting' => $setting,
        ]);
    }

    public function edit(CountSheet $counting): Response|RedirectResponse
    {
        if ($counting->isLocked()) {
            return redirect()->route('counting.show', $counting)
                ->with('error', 'Berita acara yang sudah dikunci ke buku besar tidak dapat diedit.');
        }

        $sheet = $counting->load(['lines.category', 'serviceSession', 'event']);
        $accounts = Account::active()->orderBy('name')->get();

        $categoriesQuery = Category::active()->where('direction', Direction::In);
        if ($sheet->type === CountSheetType::Event && $sheet->event_id) {
            $categoriesQuery->forEvent($sheet->event_id);
        } else {
            $categoriesQuery->general();
        }
        $categories = $categoriesQuery->orderBy('name')->get();
        $setting = ChurchSetting::current();

        return Inertia::render('counting/form', [
            'sheet' => $sheet,
            'session' => $sheet->serviceSession,
            'event' => $sheet->event,
            'type' => $sheet->type->value,
            'accounts' => $accounts,
            'categories' => $categories,
            'denominations' => $setting->cash_denominations ?? [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100],
            'today' => $sheet->date->toDateString(),
        ]);
    }

    public function update(CountSheetRequest $request, CountSheet $counting): RedirectResponse
    {
        if ($counting->isLocked()) {
            return redirect()->route('counting.show', $counting)
                ->with('error', 'Berita acara yang sudah dikunci ke buku besar tidak dapat diedit.');
        }

        $data = $request->validated();
        $calculated = $this->calculationService->calculate($data['lines']);

        DB::transaction(function () use ($counting, $data, $calculated) {
            $counting->update([
                'type' => $data['type'],
                'service_session_id' => $data['service_session_id'] ?? null,
                'event_id' => $data['event_id'] ?? null,
                'account_id' => $data['account_id'],
                'date' => $data['date'],
                'status' => CountSheetStatus::Draft, // Reset to draft if edited!
                'total_amount' => $calculated['total_amount'],
                'notes' => $data['notes'] ?? null,
            ]);

            // If confirmations table exists, clear existing confirmations on edit!
            if (Schema::hasTable('count_confirmations')) {
                DB::table('count_confirmations')->where('count_sheet_id', $counting->id)->delete();
            }

            $counting->lines()->delete();
            foreach ($calculated['lines'] as $line) {
                unset($line['id']);
                $counting->lines()->create($line);
            }
        });

        return redirect()->route('counting.show', $counting)
            ->with('success', 'Berita acara penghitungan berhasil diperbarui.');
    }

    public function destroy(CountSheet $counting): RedirectResponse
    {
        if ($counting->status !== CountSheetStatus::Draft) {
            return redirect()->route('counting.show', $counting)
                ->with('error', 'Hanya berita acara berstatus draf yang dapat dihapus.');
        }

        $counting->lines()->delete();
        $counting->delete();

        return redirect()->route('counting.index')
            ->with('success', 'Berita acara draf berhasil dihapus.');
    }
}
