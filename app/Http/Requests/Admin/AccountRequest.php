<?php

namespace App\Http\Requests\Admin;

use App\Enums\AccountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => strtoupper(trim((string) $this->code))]);
        }
    }

    public function rules(): array
    {
        $accountId = $this->route('account')?->id;

        return [
            'code' => ['required', 'string', 'max:20', Rule::unique('accounts', 'code')->ignore($accountId)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(AccountType::class)],
            'bank_name' => ['nullable', 'required_if:type,bank', 'string', 'max:100'],
            'account_number' => ['nullable', 'required_if:type,bank', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'kode rekening',
            'name' => 'nama rekening',
            'type' => 'jenis rekening',
            'bank_name' => 'nama bank',
            'account_number' => 'nomor rekening',
        ];
    }
}
