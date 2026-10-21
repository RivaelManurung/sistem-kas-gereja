<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\ChurchSetting;
use App\Models\ReportApproval;
use App\Models\ReportSignatory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportSignatoryController extends Controller
{
    public function index(): Response
    {
        $signatories = ReportSignatory::with('user')->orderBy('order')->get();
        $users = User::where('is_active', true)->orderBy('name')->get(['id', 'name', 'email']);
        $setting = ChurchSetting::current();

        return Inertia::render('admin/signatures/index', [
            'signatories' => $signatories,
            'users' => $users,
            'roles' => Role::options(),
            'stamp_url' => $setting->getStampBase64(),
        ]);
    }

    public function show(ReportSignatory $signature): Response
    {
        $signature->load('user:id,name,email');
        $roleLabel = $signature->role ? (Role::tryFrom($signature->role)?->label() ?? $signature->role) : null;

        return Inertia::render('admin/signatures/show', [
            'signatory' => [
                'id' => $signature->id,
                'title' => $signature->title,
                'position' => $signature->position,
                'role' => $signature->role,
                'role_label' => $roleLabel,
                'user' => $signature->user ? ['id' => $signature->user->id, 'name' => $signature->user->name, 'email' => $signature->user->email] : null,
                'order' => $signature->order,
                'is_active' => $signature->is_active,
                'approvals_count' => ReportApproval::where('report_signatory_id', $signature->id)->count(),
                'reports_count' => ReportApproval::where('report_signatory_id', $signature->id)->distinct('frozen_report_id')->count('frozen_report_id'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'position' => ['required', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'max:50'],
            'user_id' => ['nullable', 'exists:users,id'],
            'order' => ['required', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ]);

        ReportSignatory::create($validated);

        return redirect()->route('admin.signatures.index')
            ->with('success', 'Susunan penanda tangan berhasil ditambahkan.');
    }

    public function update(Request $request, ReportSignatory $signature): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'position' => ['required', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'max:50'],
            'user_id' => ['nullable', 'exists:users,id'],
            'order' => ['required', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ]);

        $signature->update($validated);

        return redirect()->route('admin.signatures.index')
            ->with('success', 'Susunan penanda tangan berhasil diperbarui.');
    }

    public function toggle(ReportSignatory $signature): RedirectResponse
    {
        $signature->update(['is_active' => ! $signature->is_active]);

        $status = $signature->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()
            ->with('success', "Penanda tangan berhasil {$status}.");
    }

    public function destroy(ReportSignatory $signature): RedirectResponse
    {
        $signature->delete();

        return redirect()->route('admin.signatures.index')
            ->with('success', 'Penanda tangan berhasil dihapus.');
    }
}
