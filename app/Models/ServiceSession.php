<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use App\Models\Concerns\HasCustomAttributes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceSession extends Model
{
    use Audited, HasCustomAttributes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'is_completed' => 'boolean',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(ServiceSchedule::class, 'service_schedule_id');
    }

    public function countSheets(): HasMany
    {
        return $this->hasMany(CountSheet::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('is_completed', false);
    }

    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->where('date', $date);
    }
}
