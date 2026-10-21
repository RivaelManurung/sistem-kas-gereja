<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use Illuminate\Database\Eloquent\Model;

/**
 * Isi dropdown yang boleh diubah pengurus tanpa menyentuh kode.
 * Tambahkan grup baru di GROUPS, lalu pakai `LookupOption::options('nama_grup')` di controller.
 */
class LookupOption extends Model
{
    use Audited;

    /** @var array<string, array{label: string, description: string}> */
    public const GROUPS = [
        'payment_method' => [
            'label' => 'Metode persembahan',
            'description' => 'Pilihan cara jemaat memberikan persembahan pada formulir persembahan atas nama.',
        ],
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return list<array{value: string, label: string}> */
    public static function options(string $group): array
    {
        return static::query()
            ->where('group', $group)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('label')
            ->get(['value', 'label'])
            ->map(fn (self $o) => ['value' => $o->value, 'label' => $o->label])
            ->all();
    }
}
