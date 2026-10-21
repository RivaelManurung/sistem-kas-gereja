<?php

namespace App\Http\Requests;

use App\Models\AccountingPeriod;
use Illuminate\Foundation\Http\FormRequest;

class FundTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_fund_id' => ['required', 'exists:funds,id', 'different:to_fund_id'],
            'to_fund_id' => ['required', 'exists:funds,id', 'different:from_fund_id'],
            'account_id' => ['required', 'exists:accounts,id'],
            'amount' => ['required', 'integer', 'min:1', 'max:999999999999'],
            'transfer_date' => ['required', 'date'],
            'reason' => ['required', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'from_fund_id.required' => 'Pos dana asal wajib dipilih.',
            'to_fund_id.required' => 'Pos dana tujuan wajib dipilih.',
            'from_fund_id.different' => 'Pos dana asal dan tujuan tidak boleh sama.',
            'to_fund_id.different' => 'Pos dana tujuan tidak boleh sama dengan pos dana asal.',
            'account_id.required' => 'Rekening transaksi wajib dipilih.',
            'amount.required' => 'Nominal pemindahan dana wajib diisi.',
            'amount.min' => 'Nominal pemindahan dana minimal Rp 1.',
            'transfer_date.required' => 'Tanggal transfer wajib diisi.',
            'reason.required' => 'Alasan pemindahan dana wajib dijelaskan.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->filled('transfer_date') && AccountingPeriod::isDateClosed($this->input('transfer_date'))) {
                $validator->errors()->add('transfer_date', 'Tidak dapat mengajukan pindah dana pada periode akuntansi yang sudah ditutup.');
            }
        });
    }
}
