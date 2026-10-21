<?php

namespace App\Enums;

enum CountSheetType: string
{
    case Service = 'service';
    case General = 'general';
    case Event = 'event';

    public function label(): string
    {
        return match ($this) {
            self::Service => 'Ibadah',
            self::General => 'Penerimaan Umum',
            self::Event => 'Kepanitiaan / Acara',
        };
    }
}
