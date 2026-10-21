<?php

namespace App\Enums;

enum AttributeEntity: string
{
    case Member = 'member';
    case Event = 'event';
    case Category = 'category';
    case ServiceSession = 'service_session';
    case CountSheet = 'count_sheet';
    case Expense = 'expense';

    public function label(): string
    {
        return match ($this) {
            self::Member => 'Jemaat',
            self::Event => 'Acara',
            self::Category => 'Kategori',
            self::ServiceSession => 'Sesi Ibadah',
            self::CountSheet => 'Berita Acara Hitung',
            self::Expense => 'Pengeluaran',
        };
    }
}
