<?php

namespace Database\Seeders;

use App\Enums\AccountType;
use App\Enums\Direction;
use App\Models\Account;
use App\Models\Category;
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

        $umum = Fund::firstOrCreate(
            ['code' => 'UMUM'],
            ['name' => 'Kas Umum', 'description' => 'Dana operasional umum gereja', 'is_active' => true]
        );

        $pemb = Fund::firstOrCreate(
            ['code' => 'PEMB'],
            ['name' => 'Dana Pembangunan', 'description' => 'Dana khusus pembangunan dan renovasi gereja', 'is_active' => true]
        );

        $diak = Fund::firstOrCreate(
            ['code' => 'DIAK'],
            ['name' => 'Diakonia', 'description' => 'Dana pelayanan sosial dan bantuan jemaat', 'is_active' => true]
        );

        // Categories In
        Category::firstOrCreate(
            ['name' => 'Kolekte', 'direction' => Direction::In],
            ['default_fund_id' => $umum->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => 1]
        );
        Category::firstOrCreate(
            ['name' => 'Persembahan Syukur', 'direction' => Direction::In],
            ['default_fund_id' => $umum->id, 'allows_named' => true, 'is_public' => true, 'is_active' => true, 'sort_order' => 2]
        );
        Category::firstOrCreate(
            ['name' => 'Perpuluhan', 'direction' => Direction::In],
            ['default_fund_id' => $umum->id, 'allows_named' => true, 'is_public' => true, 'is_active' => true, 'sort_order' => 3]
        );
        Category::firstOrCreate(
            ['name' => 'Persembahan Pembangunan', 'direction' => Direction::In],
            ['default_fund_id' => $pemb->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => 4]
        );
        Category::firstOrCreate(
            ['name' => 'Diakonia', 'direction' => Direction::In],
            ['default_fund_id' => $diak->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => 5]
        );

        // Categories Out
        Category::firstOrCreate(
            ['name' => 'Listrik & Air', 'direction' => Direction::Out],
            ['default_fund_id' => $umum->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => 1]
        );
        Category::firstOrCreate(
            ['name' => 'Honor', 'direction' => Direction::Out],
            ['default_fund_id' => $umum->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => 2]
        );
        Category::firstOrCreate(
            ['name' => 'Diakonia', 'direction' => Direction::Out],
            ['default_fund_id' => $diak->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => 3]
        );
        Category::firstOrCreate(
            ['name' => 'Operasional', 'direction' => Direction::Out],
            ['default_fund_id' => $umum->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => 4]
        );
        Category::firstOrCreate(
            ['name' => 'Kegiatan Komisi', 'direction' => Direction::Out],
            ['default_fund_id' => $umum->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => 5]
        );
    }
}
