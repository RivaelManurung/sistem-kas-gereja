<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EventExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entry_date' => ['required', 'date'],
            'account_id' => ['required', 'exists:accounts,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'amount' => ['required', 'integer', 'min:1', 'max:999999999999'],
            'description' => ['nullable', 'string', 'max:255'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'entry_date.required' => 'Tanggal pengeluaran wajib diisi.',
            'account_id.required' => 'Rekening sumber dana wajib dipilih.',
            'category_id.required' => 'Kategori pengeluaran wajib dipilih.',
            'amount.required' => 'Nominal pengeluaran wajib diisi.',
            'amount.min' => 'Nominal pengeluaran minimal Rp 1.',
        ];
    }
}
