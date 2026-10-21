<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ChurchSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'timezone' => ['required', 'string', 'timezone'],
            'system_name' => ['nullable', 'string', 'max:60'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,webp', 'max:2048'],
            'remove_logo' => ['boolean'],
            'stamp' => ['nullable', 'image', 'mimes:png,jpg,webp', 'max:2048'],
            'denominations' => ['required', 'array', 'min:1'],
            'denominations.*' => ['integer', 'min:1', 'distinct'],
            'min_confirmations_service' => ['required', 'integer', 'min:1', 'max:10'],
            'min_confirmations_event' => ['required', 'integer', 'min:1', 'max:10'],
            'min_confirmations_general' => ['required', 'integer', 'min:1', 'max:10'],
            'expense_approval_threshold' => ['required', 'integer', 'min:0', 'max:999999999999'],
            'allow_negative_balance' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nama gereja',
            'address' => 'alamat',
            'city' => 'kota',
            'phone' => 'nomor telepon',
            'email' => 'email',
            'timezone' => 'zona waktu',
            'system_name' => 'nama sistem',
            'logo' => 'logo',
            'denominations' => 'pecahan uang',
            'denominations.*' => 'pecahan uang',
            'min_confirmations_service' => 'konfirmasi minimal ibadah',
            'min_confirmations_event' => 'konfirmasi minimal acara',
            'min_confirmations_general' => 'konfirmasi minimal penerimaan umum',
            'expense_approval_threshold' => 'ambang persetujuan pengeluaran',
            'allow_negative_balance' => 'izinkan saldo minus',
        ];
    }
}
