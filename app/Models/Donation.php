<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Donation extends Model
{
    use HasFactory, Audited;

    protected $fillable = [
        'count_sheet_id',
        'member_id',
        'donor_name',
        'category_id',
        'amount',
        'payment_method',
        'receipt_number',
        'notes',
    ];

    protected $casts = [
        'amount' => 'integer',
    ];

    public function countSheet(): BelongsTo
    {
        return $this->belongsTo(CountSheet::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public static function generateReceiptNumber(): string
    {
        $prefix = 'RCP-' . now()->format('Ym') . '-';
        $latest = static::where('receipt_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('receipt_number');

        if ($latest) {
            $lastSeq = (int) substr($latest, strlen($prefix));
            $nextSeq = $lastSeq + 1;
        } else {
            $nextSeq = 1;
        }

        return $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }
}
