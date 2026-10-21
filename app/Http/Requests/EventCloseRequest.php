<?php

namespace App\Http\Requests;

use App\Models\LedgerEntry;
use Illuminate\Foundation\Http\FormRequest;

class EventCloseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $event = $this->route('event');
        $hasBalance = $event && LedgerEntry::getBalance($event->fund_id) > 0;

        return [
            'target_fund_id' => [
                $hasBalance ? 'required' : 'nullable',
                'exists:funds,id',
                function ($attribute, $value, $fail) use ($event) {
                    if ($event && $value == $event->fund_id) {
                        $fail('Pos dana tujuan tidak boleh sama dengan pos dana acara.');
                    }
                },
            ],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'target_fund_id.required' => 'Pos dana tujuan pemindahan sisa saldo wajib dipilih bila masih ada sisa dana.',
        ];
    }
}
