<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SignatureController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/signature', [
            'has_signature' => ! empty($user->signature_path) && Storage::disk('local')->exists($user->signature_path),
            'signature_url' => $user->getSignatureBase64(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'signature' => ['nullable', 'file', 'mimes:png,jpg,webp', 'max:2048'],
            'signature_data' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $path = null;

        if ($request->hasFile('signature')) {
            if ($user->signature_path && Storage::disk('local')->exists($user->signature_path)) {
                Storage::disk('local')->delete($user->signature_path);
            }
            $path = $request->file('signature')->store('signatures', 'local');
        } elseif ($request->filled('signature_data')) {
            $data = $request->input('signature_data');
            // Remove data URI scheme prefix if present
            if (str_contains($data, ';base64,')) {
                [, $data] = explode(';base64,', $data);
            }
            $binary = base64_decode($data);
            if ($binary !== false) {
                if ($user->signature_path && Storage::disk('local')->exists($user->signature_path)) {
                    Storage::disk('local')->delete($user->signature_path);
                }
                $filename = 'signatures/sig_'.$user->id.'_'.Str::random(16).'.png';
                Storage::disk('local')->put($filename, $binary);
                $path = $filename;
            }
        }

        if ($path) {
            $user->update(['signature_path' => $path]);
        }

        return redirect()->back()->with('success', 'Tanda tangan berhasil disimpan.');
    }
}
