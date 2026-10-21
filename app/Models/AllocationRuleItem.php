<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AllocationRuleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'allocation_rule_id',
        'fund_id',
        'percentage',
        'sort_order',
    ];

    protected $casts = [
        'percentage' => 'float',
        'sort_order' => 'integer',
    ];

    public function allocationRule(): BelongsTo
    {
        return $this->belongsTo(AllocationRule::class);
    }

    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }
}
