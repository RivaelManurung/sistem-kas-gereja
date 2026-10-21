<?php

namespace App\Enums;

/**
 * Daftar izin kanonik. Kode aplikasi hanya memeriksa izin ini, tidak pernah nama peran.
 * Peran dan isinya disimpan di database dan dikelola lewat halaman Peran & Hak Akses.
 */
enum Permission: string
{
    case CountingManage = 'counting.manage';
    case CountingVerify = 'counting.verify';
    case DepositsManage = 'deposits.manage';

    case ExpensesView = 'expenses.view';
    case ExpensesApprove = 'expenses.approve';
    case ExpensesApproveLarge = 'expenses.approve_large';
    case ExpensesPay = 'expenses.pay';
    case TransfersView = 'transfers.view';
    case TransfersApprove = 'transfers.approve';

    case EventsView = 'events.view';
    case EventsParticipate = 'events.participate';
    case EventsManage = 'events.manage';

    case ReportsView = 'reports.view';
    case ReportsManage = 'reports.manage';

    case MembersManage = 'members.manage';
    case MasterManage = 'master.manage';
    case SettingsManage = 'settings.manage';
    case UsersManage = 'users.manage';
    case RolesManage = 'roles.manage';
    case AuditView = 'audit.view';

    public function label(): string
    {
        return match ($this) {
            self::CountingManage => 'Kelola sesi ibadah, berita acara, dan persembahan',
            self::CountingVerify => 'Verifikasi dan kunci berita acara',
            self::DepositsManage => 'Catat setoran bank',
            self::ExpensesView => 'Lihat dan ajukan pengeluaran',
            self::ExpensesApprove => 'Setujui atau tolak pengeluaran',
            self::ExpensesApproveLarge => 'Setujui pengeluaran di atas ambang batas',
            self::ExpensesPay => 'Bayarkan pengeluaran',
            self::TransfersView => 'Lihat dan ajukan pindah dana',
            self::TransfersApprove => 'Setujui atau tolak pindah dana',
            self::EventsView => 'Lihat semua acara',
            self::EventsParticipate => 'Lihat acara yang diikuti',
            self::EventsManage => 'Kelola acara dan kepanitiaan',
            self::ReportsView => 'Lihat laporan keuangan',
            self::ReportsManage => 'Buat dan ajukan laporan untuk disahkan',
            self::MembersManage => 'Kelola anggota jemaat',
            self::MasterManage => 'Kelola rekening, pos dana, kategori, dan jadwal',
            self::SettingsManage => 'Ubah pengaturan gereja dan penanda tangan',
            self::UsersManage => 'Kelola pengguna',
            self::RolesManage => 'Kelola peran dan hak akses',
            self::AuditView => 'Lihat jejak aktivitas',
        };
    }

    public function group(): string
    {
        return match ($this) {
            self::CountingManage, self::CountingVerify, self::DepositsManage => 'Penerimaan',
            self::ExpensesView, self::ExpensesApprove, self::ExpensesApproveLarge, self::ExpensesPay, self::TransfersView, self::TransfersApprove => 'Pengeluaran',
            self::EventsView, self::EventsParticipate, self::EventsManage => 'Acara',
            self::ReportsView, self::ReportsManage, self::AuditView => 'Laporan dan pengawasan',
            self::MembersManage, self::MasterManage, self::SettingsManage, self::UsersManage, self::RolesManage => 'Administrasi',
        };
    }

    /**
     * Daftar izin dikelompokkan untuk matriks hak akses di halaman peran.
     *
     * @return list<array{group: string, permissions: list<array{value: string, label: string}>}>
     */
    public static function grouped(): array
    {
        $groups = [];
        foreach (self::cases() as $permission) {
            $groups[$permission->group()][] = ['value' => $permission->value, 'label' => $permission->label()];
        }

        return collect($groups)->map(fn (array $permissions, string $group) => ['group' => $group, 'permissions' => $permissions])->values()->all();
    }
}
