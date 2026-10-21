<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceSchedule extends Model
{
    use Audited;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'default_category_ids' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ServiceSession::class);
    }

    public function dayName(): string
    {
        $days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        return $days[$this->day_of_week] ?? '';
    }

    public function createSessionForDate(string $date): ServiceSession
    {
        return $this->sessions()->create([
            'date' => $date,
            'name' => $this->name,
        ]);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
