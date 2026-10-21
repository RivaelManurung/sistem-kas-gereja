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
use App\Models\LedgerEntry;
use App\Models\AllocationRule;
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

    public function show(Category $category): Response
    {
        $category->load('defaultFund:id,code,name');
        $isIn = $category->direction === Direction::In;
        $net = function (?int $year = null) use ($category, $isIn): int {
            $q = LedgerEntry::where('category_id', $category->id);
            if ($year !== null) {
                $q->whereYear('entry_date', $year);
            }
            $in = (int) (clone $q)->where('direction', Direction::In->value)->sum('amount');
            $out = (int) (clone $q)->where('direction', Direction::Out->value)->sum('amount');

            return $isIn ? $in - $out : $out - $in;
        };

        $entries = LedgerEntry::query()
            ->with(['fund:id,name', 'account:id,name'])
            ->where('category_id', $category->id)
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->limit(15)
            ->get()
            ->map(fn (LedgerEntry $e) => [
                'id' => $e->id,
                'entry_date' => $e->entry_date->toDateString(),
                'description' => $e->description,
                'direction' => $e->direction->value,
                'amount' => $e->amount,
                'source_url' => $e->source_url,
                'fund_name' => $e->fund?->name,
                'account_name' => $e->account?->name,
            ]);

        $rules = AllocationRule::query()
            ->with('items.fund:id,name')
            ->where('category_id', $category->id)
            ->orderByDesc('valid_from')
            ->orderByDesc('id')
            ->get()
            ->map(fn (AllocationRule $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'valid_from' => $r->valid_from->toDateString(),
                'is_active' => $r->is_active,
                'items' => $r->items->map(fn ($i) => ['id' => $i->id, 'fund_name' => $i->fund?->name, 'percentage' => $i->percentage])->values(),
            ]);

        return Inertia::render('admin/categories/show', [
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'direction' => $category->direction->value,
                'direction_label' => $category->direction->label(),
                'default_fund' => $category->defaultFund ? ['id' => $category->defaultFund->id, 'code' => $category->defaultFund->code, 'name' => $category->defaultFund->name] : null,
                'allows_named' => $category->allows_named,
                'is_public' => $category->is_public,
                'is_active' => $category->is_active,
                'sort_order' => $category->sort_order,
            ],
            'totals' => ['year' => $net((int) now()->year), 'all_time' => $net(), 'year_label' => (string) now()->year],
            'entries' => $entries,
            'rules' => $rules,
            'customFields' => [
                'definitions' => AttributeDefinition::active()
                    ->forEntity(AttributeEntity::Category)
                    ->orderBy('sort_order')
                    ->get(),
                'values' => (object) $category->customAttributes(),
            ],
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
