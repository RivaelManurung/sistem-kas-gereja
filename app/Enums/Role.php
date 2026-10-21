<?php

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Bendahara = 'bendahara';
    case Penghitung = 'penghitung';
    case Majelis = 'majelis';
    case Panitia = 'panitia';
    case Pemeriksa = 'pemeriksa';
    case Jemaat = 'jemaat';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Bendahara => 'Bendahara',
            self::Penghitung => 'Penghitung',
            self::Majelis => 'Majelis/Ketua',
            self::Panitia => 'Panitia Acara',
            self::Pemeriksa => 'Pemeriksa',
            self::Jemaat => 'Jemaat',
        };
    }

    /**
     * @return list<Permission>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::Admin => Permission::cases(),
            self::Bendahara => [
                Permission::CountingManage, Permission::CountingVerify, Permission::DepositsManage,
                Permission::ExpensesView, Permission::ExpensesApprove, Permission::ExpensesPay,
                Permission::TransfersView, Permission::TransfersApprove,
                Permission::EventsView, Permission::EventsManage,
                Permission::ReportsView, Permission::ReportsManage, Permission::MembersManage,
            ],
            self::Penghitung => [Permission::CountingManage],
            self::Majelis => [
                Permission::ExpensesView, Permission::ExpensesApprove, Permission::ExpensesApproveLarge,
                Permission::TransfersView, Permission::TransfersApprove, Permission::EventsView, Permission::ReportsView,
            ],
            self::Panitia => [Permission::ExpensesView, Permission::EventsParticipate],
            self::Pemeriksa => [Permission::AuditView, Permission::EventsView, Permission::ReportsView],
            self::Jemaat => [],
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
