<?php

namespace App\Models;

use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CountSheet extends Model
{
    use HasFactory, Audited;

    protected $fillable = [
        'type',
        'service_session_id',
        'account_id',
        'date',
        'status',
        'total_amount',
        'notes',
        'created_by',
        'idempotency_key',
    ];

    protected $casts = [
        'type' => CountSheetType::class,
        'status' => CountSheetStatus::class,
        'date' => 'date',
        'total_amount' => 'integer',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(CountLine::class);
    }

    public function serviceSession(): BelongsTo
    {
        return $this->belongsTo(ServiceSession::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isLocked(): bool
    {
        return $this->status === CountSheetStatus::Locked;
    }

    public function isEditable(): bool
    {
        return in_array($this->status, [CountSheetStatus::Draft, CountSheetStatus::Confirmed], true);
    }
}
