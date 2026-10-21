<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventCloseRequest;
use App\Models\Event;
use App\Services\EventClosingService;
use Illuminate\Http\RedirectResponse;

class EventClosingController extends Controller
{
    public function close(EventCloseRequest $request, Event $event, EventClosingService $service): RedirectResponse
    {
        $this->authorize('close', $event);

        $targetFundId = $request->input('target_fund_id') ? (int) $request->input('target_fund_id') : null;
        $notes = $request->input('notes');

        $result = $service->close($event, $targetFundId, $notes);

        $msg = 'Acara berhasil ditutup.';
        if ($result['transferred_balance'] > 0) {
            $msg .= ' Sisa saldo sebesar Rp '.number_format($result['transferred_balance'], 0, ',', '.').' telah dipindahkan ke '.$result['target_fund']->name.'.';
        }

        return redirect()->route('events.show', $event)
            ->with('success', $msg);
    }
}
