<?php

namespace Database\Seeders;

use App\Enums\Permission as PermissionEnum;
use App\Enums\Role as RoleEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Aman dijalankan berulang: izin yang sudah ada tidak diubah, dan pengaturan peran
     * yang sudah diedit di aplikasi tidak ditimpa. Izin baru hanya diberikan ke peran
     * bawaan sesuai bawaannya, dan Admin selalu memegang semua izin.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $created = [];
        foreach (PermissionEnum::cases() as $permission) {
            $model = Permission::firstOrCreate(['name' => $permission->value, 'guard_name' => 'web']);
            if ($model->wasRecentlyCreated) {
                $created[] = $permission->value;
            }
        }

        foreach (RoleEnum::cases() as $roleEnum) {
            $role = Role::firstOrCreate(['name' => $roleEnum->value, 'guard_name' => 'web']);
            if ($role->wasRecentlyCreated && $role->label === null) {
                $role->forceFill(['label' => $roleEnum->label()])->save();
            }

            $defaults = array_map(fn (PermissionEnum $p) => $p->value, $roleEnum->permissions());
            $toGive = $roleEnum === RoleEnum::Admin
                ? $defaults
                : ($role->wasRecentlyCreated ? $defaults : array_values(array_intersect($defaults, $created)));

            if ($toGive !== []) {
                $role->givePermissionTo($toGive);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
