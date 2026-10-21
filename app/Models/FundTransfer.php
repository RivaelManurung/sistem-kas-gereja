<?php

namespace App\Models;

use App\Enums\FundTransferStatus;
use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundTransfer extends Model
{
    use HasFactory, Audited;

    protected $fillable = [
        'from_fund_id',
        'to_fund_id',
        'account_id',
        'amount',
        'transfer_date',
        'reason',
        'status',
        'requested_by',
        'approved_by',
        'approved_at',
        'idempotency_key',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'transfer_date' => 'date',
            'status' => FundTransferStatus::class,
            'approved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (FundTransfer $transfer) {
            if ($transfer->transfer_date && AccountingPeriod::isDateClosed($transfer->transfer_date)) {
                throw new \DomainException('Tidak dapat membuat permohonan pindah dana pada periode akuntansi yang sudah ditutup.');
            }
        });
    }

    public function fromFund(): BelongsTo
    {
        return $this->belongsTo(Fund::class, 'from_fund_id');
    }

    public function toFund(): BelongsTo
    {
        return $this->belongsTo(Fund::class, 'to_fund_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isPending(): bool
    {
        return $this->status === FundTransferStatus::Pending;
    }

    public function isApproved(): bool
    {
        return $this->status === FundTransferStatus::Approved;
    }

    public function isRejected(): bool
    {
        return $this->status === FundTransferStatus::Rejected;
    }
}
