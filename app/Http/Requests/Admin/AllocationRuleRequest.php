<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AllocationRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'valid_from' => ['required', 'date'],
            'is_active' => ['boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.fund_id' => ['required', 'exists:funds,id'],
            'items.*.percentage' => ['required', 'numeric', 'min:0.01', 'max:100.00'],
            'items.*.sort_order' => ['nullable', 'integer'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);
            $total = 0;
            $fundIds = [];

            foreach ($items as $item) {
                $percentage = (float) ($item['percentage'] ?? 0);
                $fundId = $item['fund_id'] ?? null;

                $total += $percentage;

                if ($fundId) {
                    if (in_array($fundId, $fundIds, true)) {
                        $validator->errors()->add('items', 'Pos dana tidak boleh dipilih lebih dari satu kali dalam satu aturan.');
                    }
                    $fundIds[] = $fundId;
                }
            }

            // Allow small floating delta tolerance (e.g. 99.999 to 100.001)
            if (abs($total - 100.00) > 0.01) {
                $totalFormatted = number_format($total, 2);
                $validator->errors()->add('items', "Total persentase pembagian harus tepat 100.00% (saat ini: {$totalFormatted}%).");
            }
        });
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'Kategori persembahan wajib dipilih.',
            'name.required' => 'Nama aturan alokasi wajib diisi.',
            'valid_from.required' => 'Tanggal mulai berlaku wajib diisi.',
            'items.required' => 'Minimal harus ada 1 pos dana pembagian.',
        ];
    }
}
