<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use App\Models\Concerns\HasCustomAttributes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    use Audited, HasCustomAttributes, HasFactory;

    /** Berkas foto tidak perlu tampil di jejak aktivitas. */
    protected array $auditExclude = ['photo_path'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'membership_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(MemberMilestone::class)->orderBy('date');
    }

    public function ministries(): HasMany
    {
        return $this->hasMany(MemberMinistry::class)->orderByRaw('end_date is not null')->orderByDesc('start_date');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(MemberDocument::class)->latest();
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class);
    }

    public function getAgeAttribute(): ?int
    {
        return $this->birth_date?->age;
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
            $likeOp = config('database.default') === 'pgsql' ? 'ilike' : 'like';
            $q->where('name', $likeOp, "%{$escaped}%")
                ->orWhere('member_number', $likeOp, "%{$escaped}%")
                ->orWhere('phone', $likeOp, "%{$escaped}%")
                ->orWhere('nik', $likeOp, "%{$escaped}%");
        });
    }
}
