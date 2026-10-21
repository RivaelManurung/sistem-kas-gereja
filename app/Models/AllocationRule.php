<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AllocationRule extends Model
{
    use HasFactory, Audited;

    protected $fillable = [
        'category_id',
        'name',
        'valid_from',
        'is_active',
    ];

    protected $casts = [
        'valid_from' => 'date:Y-m-d',
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(AllocationRuleItem::class)->orderBy('sort_order')->orderBy('id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public static function findActiveRuleFor(int $categoryId, string $date): ?self
    {
        return static::active()
            ->with(['items.fund'])
            ->where('category_id', $categoryId)
            ->where('valid_from', '<=', $date)
            ->orderByDesc('valid_from')
            ->orderByDesc('id')
            ->first();
    }
}
