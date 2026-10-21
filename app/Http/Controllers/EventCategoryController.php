<?php

namespace App\Http\Controllers;

use App\Enums\Direction;
use App\Models\Category;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;

class EventCategoryController extends Controller
{
    public function store(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'direction' => ['required', new Enum(Direction::class)],
            'allows_named' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
        ]);

        Category::create([
            'name' => $data['name'],
            'direction' => $data['direction'],
            'default_fund_id' => $event->fund_id,
            'scope_event_id' => $event->id,
            'allows_named' => $data['allows_named'] ?? false,
            'is_public' => $data['is_public'] ?? true,
            'is_active' => true,
        ]);

        return redirect()->route('events.show', $event)
            ->with('success', 'Kategori khusus acara berhasil ditambahkan.');
    }
}
