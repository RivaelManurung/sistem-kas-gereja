<?php

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class UserRequest extends FormRequest
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
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique(User::class)->ignore($user?->id),
            ],
            'password' => [$user ? 'nullable' : 'required', 'confirmed', Password::defaults()],
            'roles' => ['present', 'array'],
            'roles.*' => ['string', 'distinct', Rule::exists('roles', 'name')],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $user = $this->route('user');
                $roles = (array) $this->input('roles', []);

                // Batas atas hak akses: peran hanya bisa diberikan oleh yang memegang seluruh izinnya.
                $current = $user?->getRoleNames()->all() ?? [];
                foreach (array_diff($roles, $current) as $name) {
                    $role = \Spatie\Permission\Models\Role::where('name', $name)->where('guard_name', 'web')->first();
                    foreach ($role?->permissions ?? [] as $permission) {
                        if (! $this->user()->can($permission->name)) {
                            $validator->errors()->add('roles', "Anda tidak dapat memberikan peran {$name} karena memuat izin yang tidak Anda miliki.");
                            break 2;
                        }
                    }
                }

                if ($user && $this->user()->is($user) && ! in_array(Role::Admin->value, $roles, true)) {
                    $validator->errors()->add('roles', 'Anda tidak dapat mencabut peran admin dari akun Anda sendiri.');
                }
            },
        ];
    }

    /**
     * @return list<string>
     */
    public function roles(): array
    {
        return array_values((array) $this->validated('roles', []));
    }
}
