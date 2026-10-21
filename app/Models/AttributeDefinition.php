<?php

namespace App\Models;

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttributeDefinition extends Model
{
    use Audited;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'entity_type' => AttributeEntity::class,
            'data_type' => AttributeType::class,
            'options' => 'array',
            'is_required' => 'boolean',
            'is_public' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class, 'attribute_definition_id');
    }

    public function hasValues(): bool
    {
        return $this->values()->exists();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForEntity(Builder $query, AttributeEntity|string $entity, ?int $scopeEventId = null): Builder
    {
        $entityVal = $entity instanceof AttributeEntity ? $entity->value : $entity;

        return $query->where('entity_type', $entityVal)
            ->where(function ($q) use ($scopeEventId) {
                if ($scopeEventId === null) {
                    $q->whereNull('scope_event_id');
                } else {
                    $q->whereNull('scope_event_id')
                        ->orWhere('scope_event_id', $scopeEventId);
                }
            });
    }
}
