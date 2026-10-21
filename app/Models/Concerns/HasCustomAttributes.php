<?php

namespace App\Models\Concerns;

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Models\AttributeDefinition;
use App\Models\AttributeValue;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

trait HasCustomAttributes
{
    public function customAttributeValues(): MorphMany
    {
        return $this->morphMany(AttributeValue::class, 'entity');
    }

    public function customAttributes(): array
    {
        $this->loadMissing(['customAttributeValues.definition']);

        $attributes = [];

        foreach ($this->customAttributeValues as $val) {
            $def = $val->definition;
            if (! $def) {
                continue;
            }

            $col = $def->data_type->valueColumn();
            $raw = $val->{$col};

            if ($raw === null) {
                continue;
            }

            if ($def->data_type === AttributeType::Number) {
                // Return exact numeric string from DB (decimal(20,4))
                $attributes[$def->key] = (string) $raw;
            } elseif ($def->data_type === AttributeType::Boolean) {
                $attributes[$def->key] = (bool) $raw;
            } else {
                $attributes[$def->key] = $raw;
            }
        }

        return $attributes;
    }

    public function syncCustomAttributes(array $input, ?int $scopeEventId = null): void
    {
        $entityType = $this->getMorphClass();

        $activeDefinitions = AttributeDefinition::active()
            ->where('entity_type', $entityType)
            ->where(function ($q) use ($scopeEventId) {
                if ($scopeEventId === null) {
                    $q->whereNull('scope_event_id');
                } else {
                    $q->whereNull('scope_event_id')
                        ->orWhere('scope_event_id', $scopeEventId);
                }
            })
            ->get()
            ->keyBy('key');

        $oldValues = $this->customAttributes();
        $changed = false;

        DB::transaction(function () use ($input, $activeDefinitions, $entityType, &$changed) {
            foreach ($input as $key => $value) {
                if (! $activeDefinitions->has($key)) {
                    continue;
                }

                $def = $activeDefinitions->get($key);
                $existingVal = $this->customAttributeValues()
                    ->where('attribute_definition_id', $def->id)
                    ->first();

                if ($value === null || $value === '') {
                    if ($existingVal) {
                        $existingVal->delete();
                        $changed = true;
                    }
                    continue;
                }

                $data = [
                    'attribute_definition_id' => $def->id,
                    'value_text' => null,
                    'value_number' => null,
                    'value_date' => null,
                    'value_bool' => null,
                    'value_option' => null,
                    'value_file' => null,
                ];

                if ($value instanceof UploadedFile) {
                    $path = $value->store("attributes/{$entityType}/{$this->getKey()}", 'local');
                    $data['value_file'] = $path;
                } else {
                    $col = $def->data_type->valueColumn();
                    $data[$col] = $value;
                }

                if ($existingVal) {
                    $existingVal->update($data);
                } else {
                    $this->customAttributeValues()->create($data);
                }

                $changed = true;
            }
        });

        $this->unsetRelation('customAttributeValues');
        $newValues = $this->customAttributes();

        if ($changed && $oldValues !== $newValues) {
            AuditLog::record($this, 'attributes_synced', $oldValues, $newValues);
        }
    }
}
