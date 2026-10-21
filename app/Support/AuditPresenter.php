<?php

namespace App\Support;

use App\Models\Account;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Event;
use App\Models\Fund;
use App\Models\Member;
use App\Models\ServiceSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Mengubah catatan audit mentah (kolom teknis, id, JSON) menjadi kalimat dan tabel
 * perubahan yang bisa dibaca pengurus gereja.
 */
class AuditPresenter
{
    private const ENTITIES = [
        'user' => 'Pengguna',
        'church_setting' => 'Pengaturan gereja',
        'account' => 'Rekening',
        'fund' => 'Pos dana',
        'category' => 'Kategori',
        'attribute_definition' => 'Field kustom',
        'attribute_value' => 'Nilai field kustom',
        'member' => 'Anggota jemaat',
        'ledger_entry' => 'Entri buku besar',
        'service_schedule' => 'Jadwal ibadah',
        'service_session' => 'Sesi ibadah',
        'count_sheet' => 'Berita acara hitung',
        'count_line' => 'Baris hitungan',
        'count_confirmation' => 'Konfirmasi hitungan',
        'allocation_rule' => 'Aturan alokasi',
        'event' => 'Acara',
        'event_member' => 'Panitia acara',
        'bank_deposit' => 'Setoran bank',
        'donation' => 'Persembahan',
        'expense' => 'Pengeluaran',
        'fund_transfer' => 'Pindah dana',
        'accounting_period' => 'Periode akuntansi',
        'role' => 'Peran',
        'lookup_option' => 'Opsi dropdown',
        'frozen_report' => 'Laporan keuangan',
        'report_approval' => 'Persetujuan laporan',
        'report_signatory' => 'Penanda tangan laporan',
    ];

    private const FIELDS = [
        'name' => 'Nama', 'code' => 'Kode', 'amount' => 'Nominal', 'notes' => 'Catatan', 'reason' => 'Alasan',
        'status' => 'Status', 'account_id' => 'Rekening', 'from_account_id' => 'Rekening asal', 'to_account_id' => 'Rekening tujuan',
        'fund_id' => 'Pos dana', 'from_fund_id' => 'Dari pos dana', 'to_fund_id' => 'Ke pos dana', 'default_fund_id' => 'Pos dana bawaan',
        'category_id' => 'Kategori', 'requested_by' => 'Pemohon', 'approved_by' => 'Disetujui oleh', 'rejected_by' => 'Ditolak oleh',
        'paid_by' => 'Dibayar oleh', 'created_by' => 'Dibuat oleh', 'user_id' => 'Pengguna', 'member_id' => 'Anggota jemaat',
        'event_id' => 'Acara', 'service_session_id' => 'Sesi ibadah', 'direction' => 'Arah', 'is_active' => 'Aktif',
        'is_public' => 'Tampil di halaman publik', 'sort_order' => 'Urutan', 'allows_named' => 'Boleh atas nama',
        'date' => 'Tanggal', 'transfer_date' => 'Tanggal pindah dana', 'deposit_date' => 'Tanggal setoran', 'entry_date' => 'Tanggal',
        'start_date' => 'Tanggal mulai', 'end_date' => 'Tanggal selesai', 'valid_from' => 'Berlaku mulai', 'birth_date' => 'Tanggal lahir',
        'description' => 'Keterangan', 'payee' => 'Penerima', 'email' => 'Email', 'phone' => 'Telepon', 'address' => 'Alamat', 'city' => 'Kota',
        'gender' => 'Jenis kelamin', 'type' => 'Jenis', 'percentage' => 'Persentase', 'target_budget' => 'Target anggaran',
        'theme' => 'Tema', 'expense_number' => 'Nomor pengeluaran', 'total_amount' => 'Total', 'account_number' => 'Nomor rekening',
        'bank_name' => 'Nama bank', 'approved_at' => 'Waktu persetujuan', 'paid_at' => 'Waktu pembayaran', 'closed_at' => 'Waktu penutupan',
        'confirmed_at' => 'Waktu konfirmasi', 'label' => 'Nama peran', 'permissions' => 'Hak akses', 'roles' => 'Peran', 'role' => 'Peran', 'role_in_event' => 'Peran di acara',
        'expense_approval_threshold' => 'Ambang persetujuan pengeluaran', 'allow_negative_balance' => 'Izinkan saldo minus',
        'min_confirmations_service' => 'Konfirmasi minimal ibadah', 'min_confirmations_event' => 'Konfirmasi minimal acara',
        'min_confirmations_general' => 'Konfirmasi minimal penerimaan umum', 'payment_method' => 'Metode pembayaran', 'method' => 'Metode',
        'closed_by' => 'Ditutup oleh', 'is_closed' => 'Periode ditutup', 'is_completed' => 'Selesai', 'is_required' => 'Wajib diisi',
        'signer_name' => 'Nama penanda tangan', 'signatory_title' => 'Judul tanda tangan', 'signatory_position' => 'Jabatan', 'position' => 'Jabatan',
        'title' => 'Judul', 'order' => 'Urutan', 'period_type' => 'Jenis periode', 'verification_code' => 'Kode verifikasi', 'frozen_at' => 'Waktu pengesahan',
        'timezone' => 'Zona waktu', 'public_page_enabled' => 'Halaman publik aktif', 'receipt_number' => 'Nomor tanda terima', 'reference_number' => 'Nomor referensi',
        'submitted_by' => 'Diajukan oleh', 'requested_by' => 'Pemohon', 'time' => 'Jam', 'day_of_week' => 'Hari', 'key' => 'Kunci', 'data_type' => 'Jenis isian',
        'entity_type' => 'Berlaku untuk', 'member_number' => 'Nomor anggota', 'count_sheet_id' => 'Berita acara', 'service_schedule_id' => 'Jadwal ibadah',
        'report_signatory_id' => 'Penanda tangan', 'frozen_report_id' => 'Laporan', 'denominations' => 'Pecahan uang', 'options' => 'Pilihan', 'bank_name' => 'Nama bank',
    ];

    private const MONEY = ['amount', 'total_amount', 'target_budget', 'expense_approval_threshold', 'balance', 'opening_balance', 'closing_balance', 'debit', 'credit'];

    private const VALUES = [
        'in' => 'Pemasukan', 'out' => 'Pengeluaran', 'cash' => 'Tunai', 'petty_cash' => 'Kas kecil', 'bank' => 'Bank', 'transfer' => 'Transfer', 'qris' => 'QRIS',
        'pending' => 'Menunggu persetujuan', 'approved' => 'Disetujui', 'rejected' => 'Ditolak', 'paid' => 'Dibayar', 'draft' => 'Draf',
        'confirmed' => 'Dikonfirmasi', 'verified' => 'Terverifikasi', 'locked' => 'Terkunci', 'planning' => 'Perencanaan', 'active' => 'Berjalan',
        'completed' => 'Selesai', 'closed' => 'Ditutup', 'open' => 'Dibuka', 'L' => 'Laki-laki', 'P' => 'Perempuan',
        'pending_approval' => 'Menunggu pengesahan', 'service' => 'Ibadah', 'general' => 'Umum', 'event' => 'Acara', 'text' => 'Teks', 'number' => 'Angka', 'date' => 'Tanggal', 'select' => 'Pilihan', 'boolean' => 'Ya/Tidak', 'file' => 'Berkas', 'member' => 'Anggota jemaat',
        'ketua' => 'Ketua', 'sekretaris' => 'Sekretaris', 'bendahara' => 'Bendahara', 'anggota' => 'Anggota',
    ];

    private const HIDDEN = ['id', 'remember_token', 'password', 'email_verified_at', 'data_snapshot', 'pdf_path', 'sha256_hash', 'signature_path', 'proof_path', 'default_category_ids', 'idempotency_key'];

    private const REFERENCES = [
        'fund_id' => Fund::class, 'from_fund_id' => Fund::class, 'to_fund_id' => Fund::class, 'default_fund_id' => Fund::class,
        'account_id' => Account::class, 'from_account_id' => Account::class, 'to_account_id' => Account::class,
        'category_id' => Category::class, 'member_id' => Member::class, 'event_id' => Event::class, 'service_session_id' => ServiceSession::class,
        'user_id' => User::class, 'requested_by' => User::class, 'approved_by' => User::class, 'rejected_by' => User::class,
        'paid_by' => User::class, 'created_by' => User::class,
    ];

    /** @var array<string, array<int, string>> */
    private array $names = [];

    /** @param Collection<int, AuditLog> $logs */
    public function __construct(Collection $logs)
    {
        $this->preload($logs);
    }

    /** @return list<array{value: string, label: string}> */
    public static function entityOptions(): array
    {
        return collect(array_keys(Relation::morphMap()))
            ->map(fn (string $alias) => ['value' => $alias, 'label' => self::entityLabel($alias)])
            ->sortBy('label')
            ->values()
            ->all();
    }

    public static function entityLabel(string $alias): string
    {
        return self::ENTITIES[$alias] ?? Str::of($alias)->replace('_', ' ')->ucfirst()->toString();
    }

    public static function eventLabel(string $event): string
    {
        return match ($event) {
            'created' => 'Dibuat',
            'updated' => 'Diubah',
            'deleted' => 'Dihapus',
            'roles_synced' => 'Peran diubah',
            default => Str::ucfirst($event),
        };
    }

    /** @return array<string, mixed> */
    public function summary(AuditLog $log): array
    {
        $changes = $this->changes($log);
        $actor = $log->user?->name ?? 'Sistem';
        $entity = Str::lower(self::entityLabel($log->auditable_type));
        $subject = $this->subject($log);
        $verb = match ($log->event) {
            'created' => 'membuat',
            'updated' => 'mengubah',
            'deleted' => 'menghapus',
            'roles_synced' => 'mengubah peran',
            default => $log->event,
        };

        $sentence = trim("{$actor} {$verb} {$entity} {$subject}");
        if ($log->event === 'updated' && count($changes) === 1) {
            $c = $changes[0];
            $sentence .= ": {$c['label']} dari {$c['old']} menjadi {$c['new']}";
        } elseif ($log->event === 'updated' && count($changes) > 1) {
            $sentence .= ': '.collect($changes)->take(3)->pluck('label')->implode(', ').(count($changes) > 3 ? ' dan lainnya' : '');
        }

        return [
            'id' => $log->id,
            'created_at' => $log->created_at?->toIso8601String(),
            'actor' => $actor,
            'event' => $log->event,
            'event_label' => self::eventLabel($log->event),
            'entity' => self::entityLabel($log->auditable_type),
            'entity_type' => $log->auditable_type,
            'auditable_type' => $log->auditable_type,
            'subject' => $subject,
            'sentence' => $sentence,
            'change_count' => count($changes),
            'ip_address' => $log->ip_address,
        ];
    }

    /** @return list<array{label: string, old: string, new: string}> */
    public function changes(AuditLog $log): array
    {
        $old = $log->old_values ?? [];
        $new = $log->new_values ?? [];
        $keys = array_values(array_diff(array_unique([...array_keys($old), ...array_keys($new)]), self::HIDDEN));

        $rows = [];
        foreach ($keys as $key) {
            $before = $this->value($key, $old[$key] ?? null);
            $after = $this->value($key, $new[$key] ?? null);
            if ($before === $after || ($before === '-' && $after === '-')) {
                continue;
            }
            $rows[] = ['label' => $this->fieldLabel($key), 'old' => $before, 'new' => $after];
        }

        return $rows;
    }

    private function subject(AuditLog $log): string
    {
        $values = [...($log->old_values ?? []), ...($log->new_values ?? [])];
        foreach (['name', 'expense_number', 'code', 'label', 'title'] as $key) {
            if (! empty($values[$key]) && is_scalar($values[$key])) {
                return '"'.$values[$key].'"';
            }
        }

        return '#'.$log->auditable_id;
    }

    private function fieldLabel(string $key): string
    {
        return self::FIELDS[$key] ?? Str::of($key)->replaceMatches('/_id$/', '')->replace('_', ' ')->ucfirst()->toString();
    }

    private function value(string $key, mixed $value): string
    {
        if ($value === null || $value === '') {
            return '-';
        }
        if (is_bool($value) || str_starts_with($key, 'is_') || in_array($key, ['allows_named', 'allow_negative_balance', 'public_page_enabled'], true)) {
            return $value ? 'Ya' : 'Tidak';
        }
        if (in_array($key, self::MONEY, true) && is_numeric($value)) {
            return 'Rp '.number_format((float) $value, 0, ',', '.');
        }
        if (isset(self::REFERENCES[$key]) && is_numeric($value)) {
            return $this->names[self::REFERENCES[$key]][(int) $value] ?? '#'.$value;
        }
        if (is_array($value)) {
            return collect($value)->map(fn ($v) => is_scalar($v) ? (string) $v : '')->filter()->implode(', ') ?: '-';
        }
        if (is_string($value) && (preg_match('/(^|_)date$/', $key) || $key === 'valid_from') && strtotime($value) !== false) {
            return Carbon::parse($value)->timezone(config('app.timezone'))->translatedFormat('j M Y');
        }
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return Carbon::parse($value)->translatedFormat('j M Y');
        }
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/', $value)) {
            return Carbon::parse($value)->timezone(config('app.timezone'))->translatedFormat('j M Y, H.i');
        }
        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->translatedFormat('j M Y');
        }

        return self::VALUES[(string) $value] ?? (string) $value;
    }

    /** @param Collection<int, AuditLog> $logs */
    private function preload(Collection $logs): void
    {
        $ids = [];
        foreach ($logs as $log) {
            foreach ([$log->old_values ?? [], $log->new_values ?? []] as $values) {
                foreach (self::REFERENCES as $field => $model) {
                    if (isset($values[$field]) && is_numeric($values[$field])) {
                        $ids[$model][] = (int) $values[$field];
                    }
                }
            }
        }

        foreach ($ids as $model => $list) {
            $this->names[$model] = $model::query()->whereIn('id', array_unique($list))->pluck('name', 'id')->all();
        }
    }
}
