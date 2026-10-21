<?php

namespace App\Enums;

enum EventStatus: string
{
    case Planning = 'planning';
    case Active = 'active';
    case Completed = 'completed';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Planning => 'Perencanaan',
            self::Active => 'Berjalan',
            self::Completed => 'Selesai',
            self::Closed => 'Ditutup',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $status) => ['value' => $status->value, 'label' => $status->label()], self::cases());
    }
}
