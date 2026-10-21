<?php

namespace App\Http\Controllers;

use App\Http\Requests\ServiceSessionRequest;
use App\Models\ServiceSchedule;
use App\Models\ServiceSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceSessionController extends Controller
{
    public function index(Request $request): Response
    {
        $sessions = ServiceSession::query()
            ->with(['schedule', 'countSheets'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('sessions/index', [
            'sessions' => $sessions,
        ]);
    }

    public function create(): Response
    {
        $schedules = ServiceSchedule::active()
            ->orderBy('day_of_week')
            ->orderBy('time')
            ->get();

        return Inertia::render('sessions/create', [
            'schedules' => $schedules,
            'today' => now()->toDateString(),
        ]);
    }

    public function store(ServiceSessionRequest $request): RedirectResponse
    {
        $session = ServiceSession::create($request->validated());

        return redirect()->route('sessions.index')
            ->with('success', "Sesi ibadah \"{$session->name}\" tanggal {$session->date->format('d/m/Y')} berhasil dibuka.");
    }
}
