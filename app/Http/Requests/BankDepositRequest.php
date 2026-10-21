<?php

namespace App\Http\Requests;

use App\Enums\AccountType;
use App\Models\Account;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class BankDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'deposit_date' => ['required', 'date'],
            'from_account_id' => ['required', 'exists:accounts,id'],
            'to_account_id' => ['required', 'exists:accounts,id', 'different:from_account_id'],
            'amount' => ['required', 'integer', 'min:1'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'proof_path' => ['nullable', 'string', 'max:255'],
            'idempotency_key' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $toAccountId = $this->input('to_account_id');
            if ($toAccountId) {
                $toAccount = Account::find($toAccountId);
                if ($toAccount && $toAccount->type !== AccountType::Bank) {
                    $validator->errors()->add('to_account_id', 'Rekening tujuan setoran harus merupakan rekening bank.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'deposit_date.required' => 'Tanggal setoran wajib diisi.',
            'from_account_id.required' => 'Rekening sumber (kas tunai) wajib dipilih.',
            'to_account_id.required' => 'Rekening bank tujuan wajib dipilih.',
            'to_account_id.different' => 'Rekening tujuan tidak boleh sama dengan rekening sumber.',
            'amount.required' => 'Nominal setoran wajib diisi.',
            'amount.min' => 'Nominal setoran harus lebih dari Rp 0.',
        ];
    }
}
