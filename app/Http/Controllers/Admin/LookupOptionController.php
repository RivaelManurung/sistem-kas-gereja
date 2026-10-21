<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LookupOption;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LookupOptionController extends Controller
{
    public function index(): Response
    {
        $options = LookupOption::query()->orderBy('group')->orderBy('sort_order')->orderBy('label')->get()->groupBy('group');

        return Inertia::render('admin/options/index', [
            'groups' => collect(LookupOption::GROUPS)->map(fn (array $meta, string $key) => [
                'key' => $key,
                'label' => $meta['label'],
                'description' => $meta['description'],
                'options' => ($options[$key] ?? collect())->map(fn (LookupOption $o) => [
                    'id' => $o->id,
                    'value' => $o->value,
                    'label' => $o->label,
                    'sort_order' => $o->sort_order,
                    'is_active' => $o->is_active,
                    'is_system' => $o->is_system,
                ])->values(),
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'group' => ['required', Rule::in(array_keys(LookupOption::GROUPS))],
            'label' => ['required', 'string', 'min:2', 'max:80'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ], [
            'label.required' => 'Nama opsi wajib diisi.',
        ]);

        $exists = LookupOption::where('group', $data['group'])->whereRaw('lower(label) = ?', [Str::lower($data['label'])])->exists();
        if ($exists) {
            return back()->withErrors(['label' => 'Sudah ada opsi dengan nama ini.'])->withInput();
        }

        $base = Str::slug($data['label'], '_') ?: 'opsi';
        $value = $base;
        for ($i = 2; LookupOption::where('group', $data['group'])->where('value', $value)->exists(); $i++) {
            $value = $base.'_'.$i;
        }

        LookupOption::create([
            'group' => $data['group'],
            'value' => $value,
            'label' => $data['label'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return back()->with('success', "Opsi {$data['label']} ditambahkan.");
    }

    public function update(Request $request, LookupOption $option): RedirectResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'min:2', 'max:80'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ]);

        $duplicate = LookupOption::where('group', $option->group)->where('id', '!=', $option->id)
            ->whereRaw('lower(label) = ?', [Str::lower($data['label'])])->exists();
        if ($duplicate) {
            return back()->withErrors(['label' => 'Sudah ada opsi dengan nama ini.']);
        }

        $option->update(['label' => $data['label'], 'sort_order' => $data['sort_order'] ?? 0]);

        return back()->with('success', 'Opsi diperbarui.');
    }

    public function toggle(LookupOption $option): RedirectResponse
    {
        if ($option->is_active && LookupOption::where('group', $option->group)->where('is_active', true)->count() <= 1) {
            return back()->with('error', 'Sisakan minimal satu opsi aktif agar dropdown tidak kosong.');
        }

        $option->update(['is_active' => ! $option->is_active]);

        return back()->with('success', $option->is_active ? 'Opsi diaktifkan.' : 'Opsi dinonaktifkan.');
    }
}
