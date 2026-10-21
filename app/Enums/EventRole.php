<?php

namespace App\Enums;

enum EventRole: string
{
    case Ketua = 'ketua';
    case Sekretaris = 'sekretaris';
    case Bendahara = 'bendahara';
    case Anggota = 'anggota';

    public function label(): string
    {
        return match ($this) {
            self::Ketua => 'Ketua Panitia',
            self::Sekretaris => 'Sekretaris',
            self::Bendahara => 'Bendahara Panitia',
            self::Anggota => 'Anggota Panitia',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $role) => ['value' => $role->value, 'label' => $role->label()], self::cases());
    }
}
