<?php

namespace App\Enums;

enum AccountType: string
{
    case Cash = 'cash';
    case PettyCash = 'petty_cash';
    case Bank = 'bank';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Kas Tunai',
            self::PettyCash => 'Kas Kecil',
            self::Bank => 'Bank',
        };
    }
}
