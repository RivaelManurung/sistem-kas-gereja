<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CountLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'count_sheet_id',
        'category_id',
        'is_cash',
        'denomination_counts',
        'amount',
        'reference_number',
        'proof_path',
    ];

    protected $casts = [
        'is_cash' => 'boolean',
        'denomination_counts' => 'array',
        'amount' => 'integer',
    ];

    public function countSheet(): BelongsTo
    {
        return $this->belongsTo(CountSheet::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
