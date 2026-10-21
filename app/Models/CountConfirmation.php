<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CountConfirmation extends Model
{
    use HasFactory, Audited;

    public $timestamps = false;

    protected $fillable = [
        'count_sheet_id',
        'user_id',
        'confirmed_at',
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
    ];

    public function countSheet(): BelongsTo
    {
        return $this->belongsTo(CountSheet::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
