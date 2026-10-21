<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AttributeValue extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'value_bool' => 'boolean',
            'value_date' => 'date:Y-m-d',
        ];
    }

    public function definition(): BelongsTo
    {
        return $this->belongsTo(AttributeDefinition::class, 'attribute_definition_id');
    }

    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    public function getTypedValueAttribute(): mixed
    {
        $def = $this->definition;
        if (! $def) {
            return null;
        }

        $col = $def->data_type->valueColumn();

        return $this->{$col};
    }
}
