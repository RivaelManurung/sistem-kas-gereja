<?php

namespace App\Http\Requests\Admin;

use App\Enums\AttributeEntity;
use App\Enums\Direction;
use App\Support\Attributes\AttributeRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('category')?->id;
        $direction = $this->input('direction');

        $rules = [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')
                    ->where(fn ($query) => $query->where('direction', $direction))
                    ->ignore($categoryId),
            ],
            'direction' => ['required', Rule::enum(Direction::class)],
            'default_fund_id' => [
                'required',
                Rule::exists('funds', 'id')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'allows_named' => ['boolean'],
            'is_public' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'attributes' => ['nullable', 'array'],
        ];

        return array_merge($rules, AttributeRules::for(AttributeEntity::Category));
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->input('direction') === Direction::Out->value && $this->boolean('allows_named')) {
                    $validator->errors()->add(
                        'allows_named',
                        'Pencatatan atas nama hanya diperbolehkan untuk kategori pemasukan.'
                    );
                }
            },
        ];
    }

    public function attributes(): array
    {
        $attrs = [
            'name' => 'nama kategori',
            'direction' => 'arah kas',
            'default_fund_id' => 'pos dana default',
            'allows_named' => 'dapat atas nama',
            'is_public' => 'tampil di publik',
            'sort_order' => 'urutan',
        ];

        return array_merge($attrs, AttributeRules::attributes(AttributeEntity::Category));
    }
}
