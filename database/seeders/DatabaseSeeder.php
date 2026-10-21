<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        // Data awal rekening, pos dana, dan kategori; tes membuat datanya sendiri.
        if (! app()->environment('testing')) {
            $this->call(MasterDataSeeder::class);
        }

        $admin = User::firstOrCreate(
            ['email' => 'admin@gereja.test'],
            ['name' => 'Admin Gereja', 'password' => 'password', 'email_verified_at' => now()],
        );
        $admin->assignRole(Role::Admin->value);
    }
}
