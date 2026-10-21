<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Direction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AllocationRuleRequest;
use App\Models\AllocationRule;
use App\Models\Category;
use App\Models\Fund;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AllocationRuleController extends Controller
{
    public function index(Request $request): Response
    {
        $rules = AllocationRule::query()
            ->with(['category', 'items.fund'])
            ->orderByDesc('valid_from')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/allocations/index', [
            'rules' => $rules,
        ]);
    }

    public function show(AllocationRule $allocation): Response
    {
        $allocation->load(['category:id,name', 'items.fund:id,code,name']);

        return Inertia::render('admin/allocations/show', [
            'rule' => [
                'id' => $allocation->id,
                'name' => $allocation->name,
                'valid_from' => $allocation->valid_from->toDateString(),
                'is_active' => $allocation->is_active,
                'category' => $allocation->category ? ['id' => $allocation->category->id, 'name' => $allocation->category->name] : null,
                'items' => $allocation->items->map(fn ($i) => [
                    'id' => $i->id,
                    'fund_id' => $i->fund_id,
                    'fund_code' => $i->fund?->code,
                    'fund_name' => $i->fund?->name,
                    'percentage' => $i->percentage,
                    'sort_order' => $i->sort_order,
                ])->values(),
            ],
        ]);
    }

    public function create(): Response
    {
        $categories = Category::active()
            ->where('direction', Direction::In)
            ->orderBy('name')
            ->get();
        $funds = Fund::active()->orderBy('name')->get();

        return Inertia::render('admin/allocations/form', [
            'rule' => null,
            'categories' => $categories,
            'funds' => $funds,
            'today' => now()->toDateString(),
        ]);
    }

    public function store(AllocationRuleRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $rule = AllocationRule::create([
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'valid_from' => $data['valid_from'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            foreach ($data['items'] as $index => $item) {
                $rule->items()->create([
                    'fund_id' => $item['fund_id'],
                    'percentage' => $item['percentage'],
                    'sort_order' => $item['sort_order'] ?? ($index + 1),
                ]);
            }
        });

        return redirect()->route('admin.allocations.index')
            ->with('success', 'Aturan alokasi berhasil dibuat.');
    }

    public function edit(AllocationRule $allocation): Response
    {
        $rule = $allocation->load(['category', 'items.fund']);
        $categories = Category::active()
            ->where('direction', Direction::In)
            ->orderBy('name')
            ->get();
        $funds = Fund::active()->orderBy('name')->get();

        return Inertia::render('admin/allocations/form', [
            'rule' => $rule,
            'categories' => $categories,
            'funds' => $funds,
            'today' => $rule->valid_from->toDateString(),
        ]);
    }

    public function update(AllocationRuleRequest $request, AllocationRule $allocation): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($allocation, $data) {
            $allocation->update([
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'valid_from' => $data['valid_from'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            $allocation->items()->delete();
            foreach ($data['items'] as $index => $item) {
                $allocation->items()->create([
                    'fund_id' => $item['fund_id'],
                    'percentage' => $item['percentage'],
                    'sort_order' => $item['sort_order'] ?? ($index + 1),
                ]);
            }
        });

        return redirect()->route('admin.allocations.index')
            ->with('success', 'Aturan alokasi berhasil diperbarui.');
    }

    public function toggle(AllocationRule $allocation): RedirectResponse
    {
        $allocation->update(['is_active' => ! $allocation->is_active]);

        return back()->with('success', 'Status keaktifan aturan alokasi berhasil diubah.');
    }
}
