<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use App\Models\Concerns\HasCustomAttributes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Member extends Model
{
    use Audited, HasCustomAttributes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function forUser(User $user): ?self
    {
        return static::where('user_id', $user->id)->first();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }

        // Escape SQL LIKE wildcards so search is literal
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);

        return $query->where(function (Builder $q) use ($escaped) {
            $q->where('name', 'LIKE', "%{$escaped}%")
                ->orWhere('member_number', 'LIKE', "%{$escaped}%");
        });
    }
}
