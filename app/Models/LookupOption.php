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
        'membership_status' => ['label' => 'Status keanggotaan', 'description' => 'Status jemaat di gereja. "Pindah" dan "Meninggal" dipakai untuk menandai anggota yang tidak lagi aktif.'],
        'wilayah_role' => ['label' => 'Jabatan pengurus wilayah', 'description' => 'Jabatan yang bisa diberikan kepada pengurus sebuah wilayah, misalnya penatua (sintua), diaken, atau ketua wilayah.'],
        'family_role' => ['label' => 'Status dalam keluarga', 'description' => 'Peran anggota di dalam satu keluarga, misalnya kepala keluarga, pasangan, atau anak.'],
        'marital_status' => ['label' => 'Status pernikahan', 'description' => 'Pilihan status pernikahan pada data jemaat.'],
        'education' => ['label' => 'Pendidikan terakhir', 'description' => 'Pilihan jenjang pendidikan terakhir.'],
        'housing_status' => ['label' => 'Status tempat tinggal', 'description' => 'Kepemilikan atau status hunian keluarga.'],
        'ministry' => ['label' => 'Pelayanan dan jabatan', 'description' => 'Daftar jabatan gerejawi, komisi, dan tim pelayanan tempat jemaat terlibat.'],
        'milestone_type' => ['label' => 'Jenis peristiwa gerejawi', 'description' => 'Baptis, sidi, pemberkatan nikah, dan atestasi yang dicatat pada riwayat jemaat.'],
        'member_document_type' => ['label' => 'Jenis dokumen jemaat', 'description' => 'Jenis berkas yang bisa diunggah pada data jemaat, seperti KTP, kartu keluarga, dan surat baptis.'],
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
