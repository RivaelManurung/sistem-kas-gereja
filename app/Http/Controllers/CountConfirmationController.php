<?php

namespace App\Http\Controllers;

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Role;
use App\Models\ChurchSetting;
use App\Models\CountConfirmation;
use App\Models\CountSheet;
use App\Services\AllocationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CountConfirmationController extends Controller
{
    public function confirm(Request $request, CountSheet $counting): RedirectResponse
    {
        if (in_array($counting->status, [CountSheetStatus::Verified, CountSheetStatus::Locked], true)) {
            return redirect()->route('counting.show', $counting)
                ->with('error', 'Berita acara ini sudah diverifikasi atau dikunci.');
        }

        $userId = $request->user()->id;

        $alreadyConfirmed = CountConfirmation::where('count_sheet_id', $counting->id)
            ->where('user_id', $userId)
            ->exists();

        if ($alreadyConfirmed) {
            throw ValidationException::withMessages([
                'user' => 'Anda sudah mengonfirmasi berita acara ini.',
            ]);
        }

        CountConfirmation::create([
            'count_sheet_id' => $counting->id,
            'user_id' => $userId,
            'confirmed_at' => now(),
        ]);

        $setting = ChurchSetting::current();
        $required = $counting->type === CountSheetType::Service
            ? $setting->min_confirmations_service
            : $setting->min_confirmations_general;

        $confirmationsCount = $counting->confirmations()->count();

        if ($confirmationsCount >= $required) {
            $counting->update([
                'status' => CountSheetStatus::Confirmed,
            ]);
        }

        return redirect()->route('counting.show', $counting)
            ->with('success', "Konfirmasi saksi berhasil disimpan ({$confirmationsCount}/{$required}).");
    }

    public function verify(Request $request, CountSheet $counting): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole([Role::Bendahara->value, Role::Admin->value])) {
            abort(403, 'Hanya Bendahara atau Admin yang berhak memverifikasi berita acara.');
        }

        if ($counting->status !== CountSheetStatus::Confirmed) {
            return redirect()->route('counting.show', $counting)
                ->with('error', 'Berita acara harus berstatus terkonfirmasi saksi sebelum dapat diverifikasi bendahara.');
        }

        $counting->update([
            'status' => CountSheetStatus::Verified,
        ]);

        return redirect()->route('counting.show', $counting)
            ->with('success', 'Berita acara berhasil diverifikasi oleh Bendahara.');
    }

    public function lock(Request $request, CountSheet $counting, AllocationService $allocationService): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole([Role::Bendahara->value, Role::Admin->value])) {
            abort(403, 'Hanya Bendahara atau Admin yang berhak mengunci berita acara ke buku besar.');
        }

        if ($counting->status !== CountSheetStatus::Verified) {
            return redirect()->route('counting.show', $counting)
                ->with('error', 'Berita acara harus berstatus terverifikasi bendahara sebelum dapat dibukukan.');
        }

        $allocationService->apply($counting);

        return redirect()->route('counting.show', $counting)
            ->with('success', 'Berita acara berhasil dikunci dan dibukukan ke buku besar.');
    }
}
