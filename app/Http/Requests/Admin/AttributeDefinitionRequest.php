<?php

namespace App\Http\Requests\Admin;

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AttributeDefinitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $def = $this->route('attribute');
        $isUpdate = $def !== null;

        $rules = [
            'label' => ['required', 'string', 'max:255'],
            'is_required' => ['boolean'],
            'is_public' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'options' => ['nullable', 'array'],
        ];

        if (! $isUpdate) {
            $entityType = $this->input('entity_type');
            $scopeEventId = $this->input('scope_event_id');

            $rules['entity_type'] = ['required', Rule::enum(AttributeEntity::class)];
            $rules['key'] = [
                'required',
                'string',
                'regex:/^[a-z][a-z0-9_]{0,49}$/',
                Rule::unique('attribute_definitions', 'key')
                    ->where(fn ($q) => $q->where('entity_type', $entityType)->where('scope_event_id', $scopeEventId)),
            ];
            $rules['data_type'] = ['required', Rule::enum(AttributeType::class)];
            $rules['scope_event_id'] = ['nullable', 'integer'];
        } else {
            $rules['data_type'] = ['required', Rule::enum(AttributeType::class)];
        }

        return $rules;
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $dataType = $this->input('data_type');
                $options = $this->input('options');

                if ($dataType === AttributeType::Select->value) {
                    if (empty($options) || ! is_array($options) || count(array_filter($options)) === 0) {
                        $validator->errors()->add('options', 'Tipe pilihan (select) memerlukan minimal satu opsi.');
                    }
                }

                $def = $this->route('attribute');
                if ($def && $def->hasValues() && $dataType !== $def->data_type->value) {
                    $validator->errors()->add('data_type', 'Tipe data tidak dapat diubah karena sudah memiliki nilai transaksi/data.');
                }
            },
        ];
    }

    public function attributes(): array
    {
        return [
            'entity_type' => 'entitas',
            'key' => 'kunci atribut',
            'label' => 'label',
            'data_type' => 'tipe data',
            'options' => 'opsi pilihan',
            'is_required' => 'wajib diisi',
            'is_public' => 'tampil publik',
            'sort_order' => 'urutan',
        ];
    }
}
