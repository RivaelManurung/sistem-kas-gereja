<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Wilayah extends Model
{
    use Audited;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function households(): HasMany
    {
        return $this->hasMany(Household::class);
    }

    public function members(): HasManyThrough
    {
        return $this->hasManyThrough(Member::class, Household::class);
    }

    public function officers(): HasMany
    {
        return $this->hasMany(WilayahOfficer::class);
    }
}
