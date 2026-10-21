<?php

namespace App\Enums;

enum CountSheetStatus: string
{
    case Draft = 'draft';
    case Confirmed = 'confirmed';
    case Verified = 'verified';
    case Locked = 'locked';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Confirmed => 'Terkonfirmasi',
            self::Verified => 'Terverifikasi Bendahara',
            self::Locked => 'Terkunci di Buku Besar',
        };
    }
}
