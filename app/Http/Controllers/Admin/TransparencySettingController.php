<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ChurchSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransparencySettingController extends Controller
{
    public function edit(): Response
    {
        $categories = Category::query()
            ->with('event:id,name')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'direction' => $category->direction,
                'is_public' => $category->is_public,
                'event_name' => $category->event?->name,
            ]);

        return Inertia::render('admin/transparency/edit', [
            'enabled' => ChurchSetting::current()->public_page_enabled,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'public_category_ids' => ['present', 'array'],
            'public_category_ids.*' => ['integer', 'exists:categories,id'],
        ], [], [
            'enabled' => 'halaman publik aktif',
            'public_category_ids' => 'kategori publik',
        ]);

        DB::transaction(function () use ($validated) {
            ChurchSetting::current()->update(['public_page_enabled' => $validated['enabled']]);

            $publicIds = $validated['public_category_ids'];
            $active = Category::where('is_active', true);

            // Per-model updates keep the audit trail; a bulk update() would skip it.
            (clone $active)->whereIn('id', $publicIds)->where('is_public', false)->get()
                ->each(fn (Category $c) => $c->update(['is_public' => true]));
            (clone $active)->whereNotIn('id', $publicIds)->where('is_public', true)->get()
                ->each(fn (Category $c) => $c->update(['is_public' => false]));
        });

        return redirect()->back()->with('success', 'Pengaturan transparansi publik berhasil disimpan.');
    }
}
