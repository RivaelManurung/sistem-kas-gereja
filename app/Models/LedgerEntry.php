<?php

namespace App\Models;

use App\Enums\Direction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use LogicException;

class LedgerEntry extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date:Y-m-d',
            'amount' => 'integer',
            'direction' => Direction::class,
        ];
    }

    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('ledger_entries is append-only');
        }

        if (AccountingPeriod::isDateClosed($this->entry_date)) {
            $dateStr = $this->entry_date instanceof \DateTimeInterface
                ? $this->entry_date->format('Y-m-d')
                : (string) $this->entry_date;
            throw new \DomainException("Tidak dapat mencatat transaksi pada periode akuntansi yang sudah ditutup ({$dateStr}).");
        }

        return parent::save($options);
    }

    public function delete(): ?bool
    {
        throw new LogicException('ledger_entries is append-only');
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

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function reverses(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reverses_id');
    }

    public function reversals(): HasMany
    {
        return $this->hasMany(self::class, 'reverses_id');
    }

    public static function getBalance(int $fundId, ?int $accountId = null): int
    {
        $query = static::where('fund_id', $fundId);

        if ($accountId !== null) {
            $query->where('account_id', $accountId);
        }

        $in = (int) (clone $query)->where('direction', Direction::In->value)->sum('amount');
        $out = (int) (clone $query)->where('direction', Direction::Out->value)->sum('amount');

        return $in - $out;
    }

    public static function getAccountBalance(int $accountId): int
    {
        $query = static::where('account_id', $accountId);

        $in = (int) (clone $query)->where('direction', Direction::In->value)->sum('amount');
        $out = (int) (clone $query)->where('direction', Direction::Out->value)->sum('amount');

        return $in - $out;
    }
}
