<?php

namespace Database\Seeders;

use App\Enums\AccountType;
use App\Models\Account;
use App\Models\Fund;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        Account::firstOrCreate(
            ['code' => 'KAS'],
            ['name' => 'Kas Tunai', 'type' => AccountType::Cash, 'is_active' => true]
        );

        Account::firstOrCreate(
            ['code' => 'KK'],
            ['name' => 'Kas Kecil', 'type' => AccountType::PettyCash, 'is_active' => true]
        );

        Fund::firstOrCreate(
            ['code' => 'UMUM'],
            ['name' => 'Kas Umum', 'description' => 'Dana operasional umum gereja', 'is_active' => true]
        );

        Fund::firstOrCreate(
            ['code' => 'PEMB'],
            ['name' => 'Dana Pembangunan', 'description' => 'Dana khusus pembangunan dan renovasi gereja', 'is_active' => true]
        );

        Fund::firstOrCreate(
            ['code' => 'DIAK'],
            ['name' => 'Diakonia', 'description' => 'Dana pelayanan sosial dan bantuan jemaat', 'is_active' => true]
        );
    }
}
