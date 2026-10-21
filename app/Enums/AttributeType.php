<?php

namespace App\Enums;

enum AttributeType: string
{
    case Text = 'text';
    case Number = 'number';
    case Date = 'date';
    case Boolean = 'boolean';
    case Select = 'select';
    case File = 'file';

    public function valueColumn(): string
    {
        return match ($this) {
            self::Text => 'value_text',
            self::Number => 'value_number',
            self::Date => 'value_date',
            self::Boolean => 'value_bool',
            self::Select => 'value_option',
            self::File => 'value_file',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Text => 'Teks Singkat',
            self::Number => 'Angka / Desimal',
            self::Date => 'Tanggal',
            self::Boolean => 'Ya / Tidak (Switch)',
            self::Select => 'Pilihan (Dropdown)',
            self::File => 'Unggah Berkas',
        };
    }
}
