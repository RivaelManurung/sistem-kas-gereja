<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankDeposit extends Model
{
    use HasFactory, Audited;

    protected $fillable = [
        'deposit_date',
        'from_account_id',
        'to_account_id',
        'amount',
        'reference_number',
        'proof_path',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'deposit_date' => 'date',
        'amount' => 'integer',
    ];

    public function fromAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    public function toAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
