<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChurchSettingRequest;
use App\Models\ChurchSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ChurchSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/settings/edit', [
            'settings' => ChurchSetting::current(),
        ]);
    }

    public function update(ChurchSettingRequest $request): RedirectResponse
    {
        $settings = ChurchSetting::current();
        $validated = $request->validated();

        $denominations = array_map('intval', $validated['denominations']);
        rsort($denominations);
        $validated['denominations'] = array_values($denominations);

        foreach (['logo' => 'logo_path'] as $field => $column) {
            if ($request->hasFile($field)) {
                if ($settings->{$column}) {
                    Storage::disk('public')->delete($settings->{$column});
                }
                $validated[$column] = $request->file($field)->store('church', 'public');
            } elseif ($request->boolean('remove_'.$field) && $settings->{$column}) {
                Storage::disk('public')->delete($settings->{$column});
                $validated[$column] = null;
            }
        }
        unset($validated['logo'], $validated['remove_logo']);

        if ($request->hasFile('stamp')) {
            if ($settings->stamp_path) {
                Storage::disk('local')->delete($settings->stamp_path);
            }
            $validated['stamp_path'] = $request->file('stamp')->store('church', 'local');
        }

        $validated['allow_negative_balance'] = $request->boolean('allow_negative_balance');

        $settings->update($validated);

        return redirect()->back()->with('success', 'Pengaturan berhasil diperbarui.');
    }
}
