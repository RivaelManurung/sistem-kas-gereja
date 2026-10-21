<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttributeEntity;
use App\Enums\Direction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Models\AttributeDefinition;
use App\Models\Category;
use App\Models\Fund;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $direction = $request->query('direction', Direction::In->value);

        $categories = Category::query()
            ->with('defaultFund')
            ->where('direction', $direction)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
            'currentDirection' => $direction,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/categories/form', [
            'category' => null,
            'funds' => Fund::active()->orderBy('name')->get(['id', 'code', 'name']),
            'directionOptions' => array_map(
                fn (Direction $d) => ['value' => $d->value, 'label' => $d->label()],
                Direction::cases()
            ),
            'customFields' => [
                'definitions' => AttributeDefinition::active()
                    ->forEntity(AttributeEntity::Category)
                    ->orderBy('sort_order')
                    ->get(),
                'values' => (object) [],
            ],
        ]);
    }

    public function store(CategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $attributes = $request->input('attributes', []);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $attributes) {
            $cat = Category::create($validated);
            if (! empty($attributes)) {
                $cat->syncCustomAttributes($attributes);
            }
        });

        return redirect()->route('admin.categories.index', ['direction' => $request->input('direction')])
            ->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('admin/categories/form', [
            'category' => $category->load('defaultFund'),
            'funds' => Fund::active()->orderBy('name')->get(['id', 'code', 'name']),
            'directionOptions' => array_map(
                fn (Direction $d) => ['value' => $d->value, 'label' => $d->label()],
                Direction::cases()
            ),
            'customFields' => [
                'definitions' => AttributeDefinition::active()
                    ->forEntity(AttributeEntity::Category)
                    ->orderBy('sort_order')
                    ->get(),
                'values' => $category->customAttributes(),
            ],
        ]);
    }

    public function update(CategoryRequest $request, Category $category): RedirectResponse
    {
        $validated = $request->validated();
        $attributes = $request->input('attributes', []);

        \Illuminate\Support\Facades\DB::transaction(function () use ($category, $validated, $attributes) {
            $category->update($validated);
            if ($attributes !== null) {
                $category->syncCustomAttributes($attributes);
            }
        });

        return redirect()->route('admin.categories.index', ['direction' => $category->direction->value])
            ->with('success', 'Kategori berhasil diperbarui.');
    }

    public function toggle(Category $category): RedirectResponse
    {
        $category->update(['is_active' => ! $category->is_active]);

        return redirect()->back()->with('success', 'Status kategori berhasil diubah.');
    }
}
