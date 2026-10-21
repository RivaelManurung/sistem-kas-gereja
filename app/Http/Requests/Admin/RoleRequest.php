<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Spatie\Permission\Models\Role;

class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Role|null $role */
        $role = $this->route('role');

        return [
            'label' => ['required', 'string', 'min:3', 'max:60', Rule::unique('roles', 'label')->ignore($role?->id)],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', 'distinct', Rule::in(array_column(Permission::cases(), 'value'))],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                /** @var Role|null $role */
                $role = $this->route('role');
                $current = $role?->permissions->pluck('name')->all() ?? [];
                $added = array_diff((array) $this->input('permissions', []), $current);

                // Batas atas hak akses: tidak bisa memberikan izin yang tidak dimiliki sendiri.
                foreach ($added as $permission) {
                    $known = Permission::tryFrom($permission);
                    if ($known && ! $this->user()->can($permission)) {
                        $validator->errors()->add('permissions', 'Anda tidak dapat memberikan izin yang tidak Anda miliki: '.$known->label().'.');
                    }
                }
            },
        ];
    }

    public function attributes(): array
    {
        return [
            'label' => 'nama peran',
            'description' => 'deskripsi',
            'permissions' => 'hak akses',
        ];
    }

    public function messages(): array
    {
        return [
            'label.required' => 'Nama peran wajib diisi.',
            'label.min' => 'Nama peran minimal 3 karakter.',
            'label.unique' => 'Sudah ada peran dengan nama ini.',
        ];
    }
}
