<?php

namespace App\Models;

use App\Enums\ExpenseStatus;
use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory, Audited;

    protected $fillable = [
        'expense_number',
        'payee',
        'amount',
        'date',
        'account_id',
        'fund_id',
        'category_id',
        'event_id',
        'description',
        'proof_path',
        'status',
        'submitted_by',
        'approved_by',
        'approved_at',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'date' => 'date',
            'status' => ExpenseStatus::class,
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Expense $expense) {
            if ($expense->date && AccountingPeriod::isDateClosed($expense->date)) {
                throw new \DomainException('Tidak dapat membuat pengeluaran pada periode akuntansi yang sudah ditutup.');
            }
        });
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function fund(): BelongsTo
    {
        return $this->belongsTo(Fund::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isPending(): bool
    {
        return $this->status === ExpenseStatus::Pending;
    }

    public function isApproved(): bool
    {
        return $this->status === ExpenseStatus::Approved;
    }

    public function isPaid(): bool
    {
        return $this->status === ExpenseStatus::Paid;
    }

    public function isRejected(): bool
    {
        return $this->status === ExpenseStatus::Rejected;
    }

    public static function generateExpenseNumber(): string
    {
        $prefix = 'EXP-' . now()->format('Ym') . '-';
        $latest = static::where('expense_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('expense_number');

        if ($latest) {
            $lastSeq = (int) substr($latest, strlen($prefix));
            $nextSeq = $lastSeq + 1;
        } else {
            $nextSeq = 1;
        }

        return $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }
}
