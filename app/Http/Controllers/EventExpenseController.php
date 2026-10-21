<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventExpenseRequest;
use App\Models\Event;
use App\Services\EventExpenseService;
use Illuminate\Http\RedirectResponse;

class EventExpenseController extends Controller
{
    public function store(EventExpenseRequest $request, Event $event, EventExpenseService $service): RedirectResponse
    {
        $this->authorize('submitExpense', $event);

        $service->recordExpense($event, $request->validated());

        return redirect()->route('events.show', $event)
            ->with('success', 'Pengeluaran acara berhasil dicatat.');
    }
}
