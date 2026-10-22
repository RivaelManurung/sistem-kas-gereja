<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Household extends Model
{
    use Audited;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function wilayah(): BelongsTo
    {
        return $this->belongsTo(Wilayah::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    /** Kepala keluarga ditentukan dari status dalam keluarga, bukan kolom terpisah, supaya tidak bisa tidak sinkron. */
    public function head(): HasOne
    {
        return $this->hasOne(Member::class)->where('family_role', 'kepala_keluarga');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }

        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);

        return $query->where(fn (Builder $q) => $q->where('name', 'LIKE', "%{$escaped}%")->orWhere('family_number', 'LIKE', "%{$escaped}%"));
    }

    public function fullAddress(): ?string
    {
        $parts = array_filter([
            $this->address,
            $this->rt_rw ? 'RT/RW '.$this->rt_rw : null,
            $this->kelurahan,
            $this->kecamatan,
            $this->city,
            $this->postal_code,
        ]);

        return $parts ? implode(', ', $parts) : null;
    }
}
