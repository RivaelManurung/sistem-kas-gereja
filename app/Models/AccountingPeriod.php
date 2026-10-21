<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountingPeriod extends Model
{
    use HasFactory, Audited;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_closed',
        'closed_at',
        'closed_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'is_closed' => 'boolean',
            'closed_at' => 'datetime',
        ];
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public static function isDateClosed(string|DateTimeInterface $date): bool
    {
        $dateString = $date instanceof DateTimeInterface ? $date->format('Y-m-d') : substr((string) $date, 0, 10);

        return static::where('is_closed', true)
            ->where('start_date', '<=', $dateString)
            ->where('end_date', '>=', $dateString)
            ->exists();
    }

    public function close(User $user): void
    {
        $this->update([
            'is_closed' => true,
            'closed_at' => now(),
            'closed_by' => $user->id,
        ]);
    }
}
