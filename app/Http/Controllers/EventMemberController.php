<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventMemberRequest;
use App\Models\Event;
use App\Models\EventMember;
use Illuminate\Http\RedirectResponse;

class EventMemberController extends Controller
{
    public function store(EventMemberRequest $request, Event $event): RedirectResponse
    {
        $this->authorize('manageMembers', $event);

        $data = $request->validated();
        $event->members()->create($data);

        return redirect()->route('events.show', $event)
            ->with('success', 'Anggota panitia berhasil ditambahkan.');
    }

    public function destroy(Event $event, EventMember $member): RedirectResponse
    {
        $this->authorize('manageMembers', $event);

        if ($member->event_id !== $event->id) {
            abort(404);
        }

        $member->delete();

        return redirect()->route('events.show', $event)
            ->with('success', 'Anggota panitia berhasil dihapus.');
    }
}
