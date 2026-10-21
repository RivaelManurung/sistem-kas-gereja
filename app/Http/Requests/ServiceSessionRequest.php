<?php

namespace App\Http\Requests;

use App\Models\ServiceSchedule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->service_schedule_id && empty($this->name)) {
            $schedule = ServiceSchedule::find($this->service_schedule_id);
            if ($schedule) {
                $this->merge(['name' => $schedule->name]);
            }
        }
    }

    public function rules(): array
    {
        $sessionId = $this->route('session')?->id;
        $scheduleId = $this->input('service_schedule_id');

        $dateRules = ['required', 'date_format:Y-m-d'];
        if (! empty($scheduleId)) {
            $dateRules[] = Rule::unique('service_sessions', 'date')
                ->where(fn ($q) => $q->where('service_schedule_id', $scheduleId))
                ->ignore($sessionId);
        }

        return [
            'service_schedule_id' => ['nullable', 'exists:service_schedules,id'],
            'date' => $dateRules,
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ];
    }

    public function attributes(): array
    {
        return [
            'service_schedule_id' => 'jadwal ibadah',
            'date' => 'tanggal ibadah',
            'name' => 'nama sesi ibadah',
            'notes' => 'catatan',
        ];
    }
}
