<?php

namespace App\Http\Requests;

use App\Models\AccountingPeriod;
use Illuminate\Foundation\Http\FormRequest;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isCreate = $this->isMethod('post');

        return [
            'payee' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:1'],
            'date' => ['required', 'date'],
            'account_id' => ['required', 'exists:accounts,id'],
            'fund_id' => ['required', 'exists:funds,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['nullable', 'string', 'max:2000'],
            'proof' => [$isCreate ? 'required' : 'nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'payee.required' => 'Penerima / pihak yang dibayar wajib diisi.',
            'amount.required' => 'Nominal pengeluaran wajib diisi.',
            'amount.min' => 'Nominal pengeluaran minimal Rp 1.',
            'date.required' => 'Tanggal pengeluaran wajib diisi.',
            'account_id.required' => 'Rekening pengeluaran wajib dipilih.',
            'fund_id.required' => 'Pos dana beban wajib dipilih.',
            'category_id.required' => 'Kategori pengeluaran wajib dipilih.',
            'proof.required' => 'Bukti nota/kuitansi fisik wajib diunggah.',
            'proof.mimes' => 'Bukti nota harus berupa file gambar (JPG, PNG) atau dokumen PDF.',
            'proof.max' => 'Ukuran file nota maksimal 5 MB.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->filled('date') && AccountingPeriod::isDateClosed($this->input('date'))) {
                $validator->errors()->add('date', 'Tidak dapat mengajukan pengeluaran pada periode akuntansi yang sudah ditutup.');
            }
        });
    }
}
