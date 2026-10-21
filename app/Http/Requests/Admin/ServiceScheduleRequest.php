<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ServiceScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'time' => ['required', 'string', 'max:10'],
            'default_category_ids' => ['nullable', 'array'],
            'default_category_ids.*' => ['integer', 'exists:categories,id'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama jadwal ibadah',
            'day_of_week' => 'hari',
            'time' => 'jam ibadah',
            'default_category_ids' => 'kategori default',
        ];
    }
}
