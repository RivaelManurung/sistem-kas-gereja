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

        if ($request->hasFile('logo')) {
            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('church', 'public');
        }

        $validated['allow_negative_balance'] = $request->boolean('allow_negative_balance');
        $validated['public_page_enabled'] = $request->boolean('public_page_enabled');

        $settings->update($validated);

        return redirect()->back()->with('success', 'Pengaturan berhasil diperbarui.');
    }
}
