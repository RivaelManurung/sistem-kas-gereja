<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Direction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ServiceScheduleRequest;
use App\Models\Category;
use App\Models\ServiceSchedule;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ServiceScheduleController extends Controller
{
    public function index(): Response
    {
        $schedules = ServiceSchedule::query()
            ->orderBy('day_of_week')
            ->orderBy('time')
            ->paginate(25);

        return Inertia::render('admin/schedules/index', [
            'schedules' => $schedules,
        ]);
    }

    public function show(ServiceSchedule $schedule): Response
    {
        $categoryIds = $schedule->default_category_ids ?? [];

        return Inertia::render('admin/schedules/show', [
            'schedule' => $schedule,
            'dayName' => $schedule->dayName(),
            'categories' => Category::whereIn('id', $categoryIds)->orderBy('sort_order')->get(['id', 'name']),
            'sessions' => $schedule->sessions()->orderByDesc('date')->orderByDesc('id')->limit(20)->get(['id', 'date', 'name', 'is_completed']),
            'sessionsCount' => $schedule->sessions()->count(),
        ]);
    }

    public function create(): Response
    {
        $categories = Category::active()
            ->where('direction', Direction::In->value)
            ->orderBy('sort_order')
            ->get(['id', 'name']);

        return Inertia::render('admin/schedules/form', [
            'schedule' => null,
            'categories' => $categories,
        ]);
    }

    public function store(ServiceScheduleRequest $request): RedirectResponse
    {
        ServiceSchedule::create($request->validated());

        return redirect()->route('admin.schedules.index')
            ->with('success', 'Jadwal ibadah berhasil ditambahkan.');
    }

    public function edit(ServiceSchedule $schedule): Response
    {
        $categories = Category::active()
            ->where('direction', Direction::In->value)
            ->orderBy('sort_order')
            ->get(['id', 'name']);

        return Inertia::render('admin/schedules/form', [
            'schedule' => $schedule,
            'categories' => $categories,
        ]);
    }

    public function update(ServiceScheduleRequest $request, ServiceSchedule $schedule): RedirectResponse
    {
        $schedule->update($request->validated());

        return redirect()->route('admin.schedules.index')
            ->with('success', 'Jadwal ibadah berhasil diperbarui.');
    }

    public function toggle(ServiceSchedule $schedule): RedirectResponse
    {
        $schedule->update(['is_active' => ! $schedule->is_active]);

        return redirect()->back()->with('success', 'Status jadwal berhasil diubah.');
    }
}
