<?php

namespace App\Models;

use App\Enums\EventStatus;
use App\Models\Concerns\Audited;
use App\Models\Concerns\HasCustomAttributes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use Audited, HasCustomAttributes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'status' => EventStatus::class,
            'target_budget' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Event $event) {
            if (! $event->fund_id) {
                $fund = static::provisionFundForEvent($event->name);
                $event->fund_id = $fund->id;
            }
        });

        static::created(function (Event $event) {
            if ($event->fund_id) {
                Fund::where('id', $event->fund_id)->update(['event_id' => $event->id]);
            }
        });
    }

    public static function provisionFundForEvent(string $eventName): Fund
    {
        $clean = strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $eventName));
        $prefix = 'EVT-'.substr($clean, 0, 8);
        if (strlen($prefix) <= 4) {
            $prefix = 'EVT-ACR';
        }

        $code = $prefix;
        $counter = 1;
        while (Fund::where('code', $code)->exists()) {
            $code = substr($prefix, 0, 7).'-'.$counter;
            $counter++;
        }

        return Fund::create([
            'code' => $code,
            'name' => 'Dana Acara: '.$eventName,
            'description' => "Dana khusus untuk acara {$eventName}",
            'is_active' => true,
        ]);
    }

    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(EventMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_members')
            ->withPivot(['role_in_event', 'notes'])
            ->withTimestamps();
    }

    public function countSheets(): HasMany
    {
        return $this->hasMany(CountSheet::class);
    }

    public function isClosed(): bool
    {
        return $this->status === EventStatus::Closed;
    }

    public function isActive(): bool
    {
        return $this->status === EventStatus::Active;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', EventStatus::Active);
    }
}
