<?php

namespace App\Support;

use App\Models\LookupOption;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rule;

/** Akses cepat ke isi dropdown yang disimpan di database (lookup_options). */
class Lookups
{
    /** @var array<string, array<string, string>> */
    private static array $cache = [];

    /** Nilai => nama, termasuk opsi nonaktif supaya data lama tetap terbaca. */
    public static function map(string $group): array
    {
        return self::$cache[$group] ??= LookupOption::where('group', $group)->orderBy('sort_order')->orderBy('label')->pluck('label', 'value')->all();
    }

    public static function label(string $group, ?string $value): ?string
    {
        return $value === null || $value === '' ? null : (self::map($group)[$value] ?? $value);
    }

    /** @return array{value: string, label: string}|null */
    public static function pair(string $group, ?string $value): ?array
    {
        return $value === null || $value === '' ? null : ['value' => $value, 'label' => self::label($group, $value)];
    }

    public static function rule(string $group): Exists
    {
        return Rule::exists('lookup_options', 'value')->where('group', $group);
    }

    public static function forget(): void
    {
        self::$cache = [];
    }
}
