<?php

namespace App\Http\Requests\Admin;

use App\Enums\AttributeEntity;
use App\Models\Member;
use App\Support\Attributes\AttributeRules;
use App\Support\Lookups;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class MemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! array_key_exists('membership_status', $this->all())) {
            $this->merge([
                'membership_status' => 'tetap',
            ]);
        }
    }

    public function rules(): array
    {
        $memberId = $this->route('member')?->id;
        $today = now()->toDateString();

        $rules = [
            'member_number' => ['nullable', 'string', 'max:50', Rule::unique('members', 'member_number')->ignore($memberId)],
            'nik' => ['nullable', 'digits:16', Rule::unique('members', 'nik')->ignore($memberId)],
            'name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
            'place_of_birth' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:'.$today],
            'marital_status' => ['nullable', Lookups::rule('marital_status')],
            'education' => ['nullable', Lookups::rule('education')],
            'occupation' => ['nullable', 'string', 'max:100'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'mother_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50', 'regex:/^[0-9+\-\s()]+$/'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'ktp_address' => ['nullable', 'string', 'max:500'],
            'household_id' => ['nullable', 'integer', Rule::exists('households', 'id')],
            'family_role' => ['nullable', Lookups::rule('family_role')],
            'membership_status' => ['required', Lookups::rule('membership_status')],
            'membership_date' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:'.$today],
            'previous_church' => ['nullable', 'string', 'max:255'],
            'wilayah' => ['nullable', Lookups::rule('wilayah')],
            'emergency_name' => ['nullable', 'string', 'max:255'],
            'emergency_phone' => ['nullable', 'string', 'max:50', 'regex:/^[0-9+\-\s()]+$/'],
            'emergency_relation' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id'), Rule::unique('members', 'user_id')->ignore($memberId)],
            'is_active' => ['boolean'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_photo' => ['boolean'],
            'attributes' => ['nullable', 'array'],
        ];

        return array_merge($rules, AttributeRules::for(AttributeEntity::Member));
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $memberId = $this->route('member')?->id;

                if ($this->input('family_role') === 'kepala_keluarga') {
                    if (! $this->input('household_id')) {
                        $validator->errors()->add('family_role', 'Pilih keluarga terlebih dahulu untuk menjadikannya kepala keluarga.');
                    } elseif (Member::where('household_id', $this->input('household_id'))->where('family_role', 'kepala_keluarga')->when($memberId, fn ($q) => $q->where('id', '!=', $memberId))->exists()) {
                        $validator->errors()->add('family_role', 'Keluarga ini sudah punya kepala keluarga.');
                    }
                }

                if ($this->filled('membership_date') && $this->filled('birth_date') && $this->input('membership_date') < $this->input('birth_date')) {
                    $validator->errors()->add('membership_date', 'Tanggal diterima tidak boleh sebelum tanggal lahir.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'nik.digits' => 'NIK harus 16 digit angka.',
            'nik.unique' => 'NIK ini sudah terdaftar pada jemaat lain.',
            'phone.regex' => 'Nomor telepon hanya boleh berisi angka, spasi, tanda + dan -.',
            'emergency_phone.regex' => 'Nomor telepon darurat hanya boleh berisi angka, spasi, tanda + dan -.',
            'birth_date.before_or_equal' => 'Tanggal lahir tidak boleh di masa depan.',
            'membership_date.before_or_equal' => 'Tanggal diterima tidak boleh di masa depan.',
            'photo.image' => 'Foto harus berupa gambar JPG, PNG, atau WebP.',
            'photo.max' => 'Ukuran foto maksimal 2 MB.',
        ];
    }

    public function attributes(): array
    {
        $attrs = [
            'member_number' => 'nomor jemaat',
            'nik' => 'NIK',
            'name' => 'nama lengkap',
            'gender' => 'jenis kelamin',
            'place_of_birth' => 'tempat lahir',
            'birth_date' => 'tanggal lahir',
            'marital_status' => 'status pernikahan',
            'education' => 'pendidikan',
            'occupation' => 'pekerjaan',
            'father_name' => 'nama ayah',
            'mother_name' => 'nama ibu',
            'phone' => 'nomor telepon',
            'email' => 'email',
            'address' => 'alamat',
            'ktp_address' => 'alamat KTP',
            'household_id' => 'keluarga',
            'family_role' => 'status dalam keluarga',
            'membership_status' => 'status keanggotaan',
            'membership_date' => 'tanggal diterima',
            'previous_church' => 'gereja asal',
            'wilayah' => 'wilayah',
            'emergency_name' => 'nama kontak darurat',
            'emergency_phone' => 'telepon kontak darurat',
            'emergency_relation' => 'hubungan kontak darurat',
            'notes' => 'catatan',
            'user_id' => 'akun pengguna',
            'photo' => 'foto',
        ];

        return array_merge($attrs, AttributeRules::attributes(AttributeEntity::Member));
    }
}
