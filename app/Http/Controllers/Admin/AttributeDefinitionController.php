<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AttributeDefinitionRequest;
use App\Models\AttributeDefinition;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttributeDefinitionController extends Controller
{
    public function index(Request $request): Response
    {
        $entityType = $request->query('entity_type', AttributeEntity::Member->value);

        $definitions = AttributeDefinition::query()
            ->where('entity_type', $entityType)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/attributes/index', [
            'definitions' => $definitions,
            'currentEntity' => $entityType,
            'entityOptions' => array_map(
                fn (AttributeEntity $e) => ['value' => $e->value, 'label' => $e->label()],
                AttributeEntity::cases()
            ),
        ]);
    }

    public function show(AttributeDefinition $attribute): Response
    {
        $event = $attribute->scope_event_id ? Event::find($attribute->scope_event_id) : null;

        return Inertia::render('admin/attributes/show', [
            'definition' => [
                'id' => $attribute->id,
                'key' => $attribute->key,
                'label' => $attribute->label,
                'entity_type' => $attribute->entity_type->value,
                'entity_label' => $attribute->entity_type->label(),
                'data_type' => $attribute->data_type->value,
                'data_type_label' => $attribute->data_type->label(),
                'options' => $attribute->options,
                'is_required' => $attribute->is_required,
                'is_public' => $attribute->is_public,
                'is_active' => $attribute->is_active,
                'sort_order' => $attribute->sort_order,
                'scope_event' => $event ? ['id' => $event->id, 'name' => $event->name] : null,
                'values_count' => $attribute->values()->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/attributes/form', [
            'definition' => null,
            'entityOptions' => array_map(
                fn (AttributeEntity $e) => ['value' => $e->value, 'label' => $e->label()],
                AttributeEntity::cases()
            ),
            'typeOptions' => array_map(
                fn (AttributeType $t) => ['value' => $t->value, 'label' => $t->label()],
                AttributeType::cases()
            ),
        ]);
    }

    public function store(AttributeDefinitionRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        if ($validated['data_type'] === AttributeType::Select->value && isset($validated['options'])) {
            $validated['options'] = array_values(array_unique(array_filter($validated['options'])));
        }

        AttributeDefinition::create($validated);

        return redirect()->route('admin.attributes.index', ['entity_type' => $validated['entity_type']])
            ->with('success', 'Definisi atribut berhasil ditambahkan.');
    }

    public function edit(AttributeDefinition $attribute): Response
    {
        return Inertia::render('admin/attributes/form', [
            'definition' => $attribute,
            'hasValues' => $attribute->hasValues(),
            'entityOptions' => array_map(
                fn (AttributeEntity $e) => ['value' => $e->value, 'label' => $e->label()],
                AttributeEntity::cases()
            ),
            'typeOptions' => array_map(
                fn (AttributeType $t) => ['value' => $t->value, 'label' => $t->label()],
                AttributeType::cases()
            ),
        ]);
    }

    public function update(AttributeDefinitionRequest $request, AttributeDefinition $attribute): RedirectResponse
    {
        $validated = $request->validated();
        unset($validated['key'], $validated['entity_type']);

        if (isset($validated['data_type']) && $validated['data_type'] === AttributeType::Select->value && isset($validated['options'])) {
            $validated['options'] = array_values(array_unique(array_filter($validated['options'])));
        }

        $attribute->update($validated);

        return redirect()->route('admin.attributes.index', ['entity_type' => $attribute->entity_type->value])
            ->with('success', 'Definisi atribut berhasil diperbarui.');
    }

    public function toggle(AttributeDefinition $attribute): RedirectResponse
    {
        $attribute->update(['is_active' => ! $attribute->is_active]);

        return redirect()->back()->with('success', 'Status atribut berhasil diubah.');
    }
}
