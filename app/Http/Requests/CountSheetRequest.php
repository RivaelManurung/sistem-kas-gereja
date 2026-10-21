<?php

namespace App\Http\Requests;

use App\Enums\CountSheetType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class CountSheetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sheetId = $this->route('sheet')?->id ?? $this->route('counting')?->id;

        return [
            'type' => ['required', new Enum(CountSheetType::class)],
            'service_session_id' => [
                Rule::requiredIf($this->input('type') === CountSheetType::Service->value),
                'nullable',
                'exists:service_sessions,id',
            ],
            'event_id' => [
                Rule::requiredIf($this->input('type') === CountSheetType::Event->value),
                'nullable',
                'exists:events,id',
            ],
            'account_id' => ['required', 'exists:accounts,id'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'idempotency_key' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('count_sheets', 'idempotency_key')->ignore($sheetId),
            ],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.category_id' => ['required', 'exists:categories,id'],
            'lines.*.is_cash' => ['required', 'boolean'],
            'lines.*.denomination_counts' => ['nullable', 'array'],
            'lines.*.amount' => ['nullable', 'numeric', 'min:0'],
            'lines.*.reference_number' => ['nullable', 'string', 'max:100'],
            'lines.*.proof_path' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Jenis berita acara wajib dipilih.',
            'service_session_id.required' => 'Sesi ibadah wajib dipilih untuk berita acara ibadah.',
            'event_id.required' => 'Acara wajib dipilih untuk berita acara kepanitiaan / acara.',
            'account_id.required' => 'Rekening tujuan wajib dipilih.',
            'date.required' => 'Tanggal penghitungan wajib diisi.',
            'idempotency_key.unique' => 'Formulir ini sudah pernah dikirimkan sebelumnya (mencegah duplikasi).',
            'lines.required' => 'Minimal harus ada 1 baris persembahan yang dihitung.',
            'lines.min' => 'Minimal harus ada 1 baris persembahan yang dihitung.',
        ];
    }
}
