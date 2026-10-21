<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Model;

class ChurchSetting extends Model
{
    use Audited;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'denominations' => 'array',
            'min_confirmations_service' => 'integer',
            'min_confirmations_event' => 'integer',
            'min_confirmations_general' => 'integer',
            'expense_approval_threshold' => 'integer',
            'allow_negative_balance' => 'boolean',
            'public_page_enabled' => 'boolean',
        ];
    }

    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create([
            'name' => 'Gereja',
            'timezone' => 'Asia/Jakarta',
            'denominations' => [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100],
            'min_confirmations_service' => 2,
            'min_confirmations_event' => 2,
            'min_confirmations_general' => 2,
            'expense_approval_threshold' => 0,
            'allow_negative_balance' => false,
            'public_page_enabled' => false,
        ]);
    }
}
