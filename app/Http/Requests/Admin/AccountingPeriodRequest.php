<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AccountingPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'close_immediately' => ['nullable', 'boolean'],
            'opening_balances' => ['nullable', 'array'],
            'opening_balances.*.account_id' => ['required_with:opening_balances', 'exists:accounts,id'],
            'opening_balances.*.fund_id' => ['required_with:opening_balances', 'exists:funds,id'],
            'opening_balances.*.amount' => ['required_with:opening_balances', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama periode akuntansi wajib diisi.',
            'start_date.required' => 'Tanggal awal periode wajib diisi.',
            'end_date.required' => 'Tanggal akhir periode wajib diisi.',
            'end_date.after_or_equal' => 'Tanggal akhir harus sama dengan atau setelah tanggal awal.',
        ];
    }
}
