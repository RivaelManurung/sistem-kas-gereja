<?php

namespace App\Support\Attributes;

use App\Enums\AttributeEntity;
use App\Enums\AttributeType;
use App\Models\AttributeDefinition;
use Illuminate\Validation\Rule;

class AttributeRules
{
    public static function for(AttributeEntity|string $entity, ?int $scopeEventId = null): array
    {
        $definitions = AttributeDefinition::active()
            ->forEntity($entity, $scopeEventId)
            ->get();

        $rules = [];

        foreach ($definitions as $def) {
            $fieldKey = 'attributes.'.$def->key;
            $fieldRules = [];

            $fieldRules[] = $def->is_required ? 'required' : 'nullable';

            switch ($def->data_type) {
                case AttributeType::Text:
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'max:65535';
                    break;
                case AttributeType::Number:
                    $fieldRules[] = 'numeric';
                    $fieldRules[] = 'regex:/^-?\d+(\.\d{1,4})?$/';
                    $fieldRules[] = function ($attr, $value, $fail) {
                        if (is_string($value) && preg_match('/^\d{1,3}(\.\d{3})+$/', $value)) {
                            $fail('Format angka tidak boleh menggunakan tanda titik sebagai pemisah ribuan.');
                        }
                    };
                    break;
                case AttributeType::Date:
                    $fieldRules[] = 'date_format:Y-m-d';
                    break;
                case AttributeType::Boolean:
                    $fieldRules[] = 'boolean';
                    break;
                case AttributeType::Select:
                    $fieldRules[] = 'string';
                    $fieldRules[] = Rule::in($def->options ?? []);
                    break;
                case AttributeType::File:
                    $fieldRules[] = 'file';
                    $fieldRules[] = 'mimes:pdf,jpg,jpeg,png,webp';
                    $fieldRules[] = 'max:5120';
                    break;
            }

            $rules[$fieldKey] = $fieldRules;
        }

        return $rules;
    }

    public static function attributes(AttributeEntity|string $entity, ?int $scopeEventId = null): array
    {
        $definitions = AttributeDefinition::active()
            ->forEntity($entity, $scopeEventId)
            ->get();

        $attributes = [];

        foreach ($definitions as $def) {
            $attributes['attributes.'.$def->key] = $def->label;
        }

        return $attributes;
    }
}
