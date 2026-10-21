<?php

namespace App\Models;

use App\Enums\Direction;
use App\Models\Concerns\Audited;
use App\Models\Concerns\HasCustomAttributes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Category extends Model
{
    use Audited, HasCustomAttributes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'direction' => Direction::class,
            'allows_named' => 'boolean',
            'is_public' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function defaultFund(): BelongsTo
    {
        return $this->belongsTo(Fund::class, 'default_fund_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeDirection(Builder $query, Direction|string $direction): Builder
    {
        $val = $direction instanceof Direction ? $direction->value : $direction;

        return $query->where('direction', $val);
    }
}
