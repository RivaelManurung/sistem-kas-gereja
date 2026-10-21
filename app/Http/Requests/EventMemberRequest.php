<?php

namespace App\Http\Requests;

use App\Enums\EventRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class EventMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'exists:users,id'],
            'member_id' => ['nullable', 'exists:members,id'],
            'role_in_event' => ['required', new Enum(EventRole::class)],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'role_in_event.required' => 'Peran panitia wajib dipilih.',
        ];
    }
}
