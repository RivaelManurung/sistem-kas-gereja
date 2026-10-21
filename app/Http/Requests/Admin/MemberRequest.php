<?php

namespace App\Http\Requests\Admin;

use App\Enums\AttributeEntity;
use App\Support\Attributes\AttributeRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $memberId = $this->route('member')?->id;

        $rules = [
            'member_number' => ['nullable', 'string', 'max:50', Rule::unique('members', 'member_number')->ignore($memberId)],
            'name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
            'birth_date' => ['nullable', 'date_format:Y-m-d'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id'), Rule::unique('members', 'user_id')->ignore($memberId)],
            'is_active' => ['boolean'],
            'attributes' => ['nullable', 'array'],
        ];

        return array_merge($rules, AttributeRules::for(AttributeEntity::Member));
    }

    public function attributes(): array
    {
        $attrs = [
            'member_number' => 'nomor jemaat',
            'name' => 'nama lengkap',
            'gender' => 'jenis kelamin',
            'birth_date' => 'tanggal lahir',
            'phone' => 'nomor telepon',
            'email' => 'email',
            'address' => 'alamat',
            'user_id' => 'akun pengguna',
        ];

        return array_merge($attrs, AttributeRules::attributes(AttributeEntity::Member));
    }
}
