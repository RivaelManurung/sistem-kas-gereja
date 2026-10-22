<?php

namespace Database\Seeders;

use App\Enums\AccountType;
use App\Enums\CountSheetStatus;
use App\Enums\CountSheetType;
use App\Enums\Direction;
use App\Enums\EventRole;
use App\Enums\ExpenseStatus;
use App\Enums\Role as RoleEnum;
use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\AllocationRule;
use App\Models\AllocationRuleItem;
use App\Models\AttributeDefinition;
use App\Models\AttributeValue;
use App\Models\BankDeposit;
use App\Models\Category;
use App\Models\ChurchSetting;
use App\Models\CountConfirmation;
use App\Models\CountLine;
use App\Models\CountSheet;
use App\Models\Donation;
use App\Models\Event;
use App\Models\EventMember;
use App\Models\Household;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\LedgerEntry;
use App\Models\Member;
use App\Models\ReportApproval;
use App\Models\ReportSignatory;
use App\Models\ServiceSchedule;
use App\Models\ServiceSession;
use App\Models\User;
use App\Models\Wilayah;
use App\Services\AccountingPeriodService;
use App\Services\AllocationService;
use App\Services\CountCalculationService;
use App\Services\EventClosingService;
use App\Services\EventExpenseService;
use App\Services\ExpenseService;
use App\Services\FundTransferService;
use App\Services\LedgerService;
use App\Services\ReportFreezeService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Data contoh setahun penuh untuk jemaat fiktif, dibuat lewat service aplikasi sendiri
 * (hitung kolekte, alokasi, setoran, pengeluaran, pindah dana, acara, laporan) supaya buku besar,
 * jejak aktivitas, dan laporan konsisten. Tanggal mengikuti garis waktu, bukan waktu seeding.
 *
 * Jalankan di database kosong:  php artisan migrate:fresh --seed && php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    private const START = '2025-11-01';

    /** @var array<string, User> */
    private array $users = [];

    /** @var array<string, Account> */
    private array $accounts = [];

    /** @var array<string, Fund> */
    private array $funds = [];

    /** @var array<string, Category> */
    private array $inCats = [];

    /** @var array<string, Category> */
    private array $outCats = [];

    /** @var list<Member> */
    private array $members = [];

    /** @var list<Member> */
    private array $tithers = [];

    /** @var array<string, ServiceSchedule> */
    private array $schedules = [];

    private Carbon $today;

    private int $skipped = 0;

    /** @var array<string, string> */
    private array $eventTarget = [];

    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->error('Seeder data contoh tidak dijalankan di production.');

            return;
        }

        if (CountSheet::query()->exists() || Expense::query()->exists()) {
            $this->command?->warn('Sudah ada data transaksi. Jalankan "php artisan migrate:fresh --seed" lebih dulu agar data contoh konsisten.');

            return;
        }

        mt_srand(20261021);
        $this->today = Carbon::now()->startOfDay();

        $this->call([RolePermissionSeeder::class, MasterDataSeeder::class]);

        $this->assets();
        $this->settings();
        $this->people();
        $this->master();
        $this->members();
        $this->periods();
        $this->openingBalances();

        $events = $this->events();

        foreach (CarbonPeriod::create(self::START, '1 month', $this->today->copy()->startOfMonth()) as $monthStart) {
            $this->month(Carbon::instance($monthStart), $events);
        }

        $this->currentWeekLeftovers();
        $this->reports();
        $this->closeOldPeriods();

        Carbon::setTestNow();
        Auth::logout();

        $this->command?->info(sprintf(
            'Data contoh selesai: %d anggota, %d berita acara, %d persembahan, %d pengeluaran, %d entri buku besar (%d transaksi dilewati karena saldo tidak cukup).',
            Member::count(), CountSheet::count(), Donation::count(), Expense::count(), LedgerEntry::count(), $this->skipped,
        ));
    }

    // ------------------------------------------------------------------ utilitas

    private function at(Carbon $date, int $hour = 10, int $minute = 0): void
    {
        Carbon::setTestNow($date->copy()->setTime($hour, $minute, mt_rand(0, 59)));
    }

    private function as(User $user): void
    {
        Auth::setUser($user);
    }

    private function rand(int $min, int $max, int $step = 1): int
    {
        return (int) (round(mt_rand($min, $max) / $step) * $step);
    }

    private function pick(array $items): mixed
    {
        return $items[array_rand($items)];
    }

    private function chance(int $percent): bool
    {
        return mt_rand(1, 100) <= $percent;
    }

    private function rupiah(int $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }

    // ------------------------------------------------------------------ aset & pengaturan

    private function assets(): void
    {
        $dir = __DIR__.'/demo-assets';
        Storage::disk('public')->put('expenses/nota-demo.pdf', file_get_contents($dir.'/nota-demo.pdf'));
        foreach ([1, 2, 3] as $i) {
            Storage::disk('local')->put("signatures/demo-{$i}.png", file_get_contents($dir."/signature-{$i}.png"));
        }
    }

    private function settings(): void
    {
        ChurchSetting::current()->update([
            'name' => 'GKI Betlehem Sentosa',
            'address' => 'Jl. Kebon Jeruk Raya No. 27, Kebon Jeruk',
            'city' => 'Jakarta Barat',
            'phone' => '021-5550142',
            'email' => 'sekretariat@betlehemsentosa.example',
            'timezone' => 'Asia/Jakarta',
            'expense_approval_threshold' => 5_000_000,
            'public_page_enabled' => true,
            'allow_negative_balance' => false,
        ]);
    }

    // ------------------------------------------------------------------ pengguna

    private function people(): void
    {
        $defs = [
            'admin' => ['admin@gereja.test', 'Admin Gereja', [RoleEnum::Admin]],
            'bendahara' => ['bendahara@gereja.test', 'Rosmawati Sitompul', [RoleEnum::Bendahara]],
            'majelis' => ['majelis@gereja.test', 'Pdt. Daniel Simanjuntak', [RoleEnum::Majelis]],
            'majelis2' => ['majelis2@gereja.test', 'Pnt. Yohanes Tumbelaka', [RoleEnum::Majelis]],
            'penghitung' => ['penghitung@gereja.test', 'Maria Nainggolan', [RoleEnum::Penghitung]],
            'penghitung2' => ['penghitung2@gereja.test', 'Budi Santoso', [RoleEnum::Penghitung]],
            'penghitung3' => ['penghitung3@gereja.test', 'Linda Kusuma', [RoleEnum::Penghitung]],
            'panitia' => ['panitia@gereja.test', 'Stenly Mamahit', [RoleEnum::Panitia]],
            'panitia2' => ['panitia2@gereja.test', 'Debora Pasaribu', [RoleEnum::Panitia]],
            'pemeriksa' => ['pemeriksa@gereja.test', 'Ir. Parlindungan Harahap', [RoleEnum::Pemeriksa]],
        ];

        foreach ($defs as $key => [$email, $name, $roles]) {
            $user = User::firstOrCreate(['email' => $email], ['name' => $name, 'password' => 'password', 'email_verified_at' => now()]);
            $user->forceFill(['name' => $name])->save();
            $user->syncRoles(array_map(fn (RoleEnum $r) => $r->value, $roles));
            $this->users[$key] = $user;
        }

        foreach (['bendahara' => 1, 'majelis' => 2, 'pemeriksa' => 3] as $key => $i) {
            $this->users[$key]->forceFill(['signature_path' => "signatures/demo-{$i}.png"])->save();
        }
    }

    // ------------------------------------------------------------------ data master

    private function master(): void
    {
        $this->as($this->users['admin']);

        foreach ([['KAS', 'Kas Tunai'], ['KK', 'Kas Kecil']] as [$code]) {
            $this->accounts[$code] = Account::where('code', $code)->firstOrFail();
        }
        $this->accounts['BCA'] = Account::firstOrCreate(['code' => 'BCA-OPS'], [
            'name' => 'Bank BCA Operasional', 'type' => AccountType::Bank, 'bank_name' => 'BCA', 'account_number' => '0891234567', 'is_active' => true,
        ]);
        $this->accounts['MDR'] = Account::firstOrCreate(['code' => 'MDR-PMB'], [
            'name' => 'Bank Mandiri Pembangunan', 'type' => AccountType::Bank, 'bank_name' => 'Mandiri', 'account_number' => '1230004567890', 'is_active' => true,
        ]);

        foreach (Fund::all() as $fund) {
            $this->funds[$fund->code] = $fund;
        }
        $this->funds['BEAS'] = Fund::firstOrCreate(['code' => 'BEAS'], ['name' => 'Dana Beasiswa', 'description' => 'Beasiswa pendidikan anak jemaat', 'is_active' => true]);
        $this->funds['KOMS'] = Fund::firstOrCreate(['code' => 'KOMS'], ['name' => 'Dana Komisi', 'description' => 'Kegiatan komisi pelayanan', 'is_active' => true]);

        $in = [
            ['Persembahan Natal', 'UMUM', true, true], ['Persembahan Paskah', 'UMUM', true, true],
            ['Iuran Kegiatan', 'UMUM', false, false], ['Persembahan Khusus Pembangunan Aula', 'PEMB', false, true],
        ];
        $out = [
            ['Pemeliharaan Gedung', 'UMUM'], ['Konsumsi & Perjamuan', 'UMUM'], ['Beasiswa', 'BEAS'],
            ['Perlengkapan Ibadah', 'UMUM'], ['Transportasi & Akomodasi', 'UMUM'], ['Pembangunan & Renovasi', 'PEMB'],
        ];
        $sort = 20;
        foreach ($in as [$name, $fund, $named, $public]) {
            Category::firstOrCreate(['name' => $name, 'direction' => Direction::In], [
                'default_fund_id' => $this->funds[$fund]->id, 'allows_named' => $named, 'is_public' => $public, 'is_active' => true, 'sort_order' => $sort++,
            ]);
        }
        foreach ($out as [$name, $fund]) {
            Category::firstOrCreate(['name' => $name, 'direction' => Direction::Out], [
                'default_fund_id' => $this->funds[$fund]->id, 'allows_named' => false, 'is_public' => true, 'is_active' => true, 'sort_order' => $sort++,
            ]);
        }
        foreach (Category::all() as $c) {
            if ($c->direction === Direction::In) {
                $this->inCats[$c->name] = $c;
            } else {
                $this->outCats[$c->name] = $c;
            }
        }

        $rules = [
            'Perpuluhan' => ['UMUM' => 70, 'DIAK' => 20, 'PEMB' => 10],
            'Persembahan Syukur' => ['UMUM' => 80, 'DIAK' => 20],
            'Persembahan Natal' => ['UMUM' => 60, 'DIAK' => 40],
        ];
        foreach ($rules as $category => $split) {
            $rule = AllocationRule::create(['category_id' => $this->inCats[$category]->id, 'name' => "Alokasi {$category}", 'valid_from' => '2025-01-01', 'is_active' => true]);
            $i = 1;
            foreach ($split as $fund => $pct) {
                AllocationRuleItem::create(['allocation_rule_id' => $rule->id, 'fund_id' => $this->funds[$fund]->id, 'percentage' => $pct, 'sort_order' => $i++]);
            }
        }

        $defaultCats = array_values(array_map(fn ($n) => $this->inCats[$n]->id, ['Kolekte', 'Persembahan Syukur', 'Perpuluhan', 'Persembahan Pembangunan', 'Diakonia']));
        foreach ([['Ibadah Umum I', 0, '07:30'], ['Ibadah Umum II', 0, '10:00'], ['Ibadah Pemuda', 0, '17:00'], ['Ibadah Doa Rabu', 3, '19:00']] as [$name, $day, $time]) {
            $this->schedules[$name] = ServiceSchedule::create(['name' => $name, 'day_of_week' => $day, 'time' => $time, 'default_category_ids' => $defaultCats, 'is_active' => true]);
        }

        ReportSignatory::create(['title' => 'Dibuat oleh', 'position' => 'Bendahara', 'role' => 'bendahara', 'user_id' => $this->users['bendahara']->id, 'order' => 1, 'is_active' => true]);
        ReportSignatory::create(['title' => 'Diperiksa oleh', 'position' => 'Pemeriksa Keuangan', 'role' => 'pemeriksa', 'user_id' => $this->users['pemeriksa']->id, 'order' => 2, 'is_active' => true]);
        ReportSignatory::create(['title' => 'Disetujui oleh', 'position' => 'Ketua Majelis', 'role' => 'majelis', 'user_id' => $this->users['majelis']->id, 'order' => 3, 'is_active' => true]);
    }

    // ------------------------------------------------------------------ anggota jemaat

    private function members(): void
    {
        $this->as($this->users['admin']);

        $male = ['Daniel', 'Yohanes', 'Samuel', 'Markus', 'Lukas', 'Petrus', 'Andreas', 'Timotius', 'Paulus', 'Yakub', 'Stefanus', 'Benyamin', 'Hendra', 'Agus', 'Budi', 'Wahyu', 'Jeffry', 'Stenly', 'Parlindungan', 'Hotma', 'Mangatas', 'Ferdinand', 'Rudy', 'Ivan', 'Gideon', 'Elias', 'Nathanael', 'Josua', 'Bonar', 'Riko'];
        $female = ['Maria', 'Debora', 'Ruth', 'Marta', 'Elisabeth', 'Hana', 'Lidia', 'Rebecca', 'Sarah', 'Yohana', 'Rosmawati', 'Linda', 'Meity', 'Sri', 'Rotua', 'Susi', 'Ratna', 'Natalia', 'Grace', 'Christine', 'Vera', 'Yuliana', 'Tabita', 'Priskila', 'Lasma', 'Tiur'];
        $surnames = ['Simanjuntak', 'Siahaan', 'Nainggolan', 'Sitompul', 'Pasaribu', 'Harahap', 'Tambunan', 'Panjaitan', 'Sihombing', 'Gultom', 'Situmorang', 'Hutagalung', 'Purba', 'Sinaga', 'Wibowo', 'Santoso', 'Kusuma', 'Wijaya', 'Susilo', 'Lumempouw', 'Tumbelaka', 'Mamahit', 'Rumbayan', 'Kalalo', 'Tanuwijaya', 'Gunawan', 'Halim', 'Saputra', 'Hidayat', 'Nugroho', 'Hutapea', 'Silalahi'];
        $jobs = ['Karyawan swasta', 'Guru', 'Wiraswasta', 'Perawat', 'Dokter', 'Pegawai negeri', 'Insinyur', 'Akuntan', 'Pengacara', 'Dosen', 'Pedagang', 'Arsitek', 'Apoteker'];
        $birthPlaces = ['Jakarta', 'Medan', 'Bandung', 'Surabaya', 'Manado', 'Pematang Siantar', 'Semarang', 'Makassar', 'Kupang', 'Yogyakarta', 'Tarutung', 'Ambon'];
        $areas = [
            ['Kebon Jeruk', 'Kebon Jeruk', '11530'], ['Palmerah', 'Palmerah', '11480'], ['Meruya Utara', 'Kembangan', '11620'], ['Srengseng', 'Kembangan', '11630'],
            ['Joglo', 'Kembangan', '11640'], ['Duri Kepa', 'Kebon Jeruk', '11510'], ['Sukabumi Utara', 'Kebon Jeruk', '11540'],
        ];
        $streets = ['Jl. Kebon Jeruk Raya', 'Jl. Palmerah Barat', 'Jl. Meruya Ilir', 'Jl. Puri Indah', 'Jl. Taman Kota', 'Jl. Kembangan Utara', 'Jl. Srengseng Raya', 'Jl. Joglo Raya', 'Jl. Tanjung Duren', 'Jl. Green Garden'];
        $churches = ['GKI Pondok Indah', 'HKBP Kebayoran', 'GPIB Immanuel', 'GKJ Bintaro', 'GBKP Jakarta', 'GKI Kebayoran Baru', 'GMIM Eben Haezer', 'HKBP Tanjung Priok'];
        $ministers = ['Pdt. Daniel Simanjuntak', 'Pdt. Samuel Wijaya', 'Pdt. Ev. Rahel Gunawan', 'Pdt. Markus Hidayat', 'Pdt. Yohanes Silalahi'];

        $bloodType = AttributeDefinition::create(['entity_type' => 'member', 'key' => 'golongan_darah', 'label' => 'Golongan darah', 'data_type' => 'select', 'options' => ['A', 'B', 'AB', 'O'], 'is_required' => false, 'is_public' => false, 'is_active' => true, 'sort_order' => 1]);

        $linkedUsers = [];
        foreach (range(1, 8) as $i) {
            $user = User::firstOrCreate(['email' => $i === 1 ? 'jemaat@gereja.test' : "jemaat{$i}@gereja.test"], ['name' => 'Jemaat '.$i, 'password' => 'password', 'email_verified_at' => now()]);
            $user->syncRoles([RoleEnum::Jemaat->value]);
            $linkedUsers[] = $user;
        }

        $used = [];
        $seq = 0;
        $familyNo = 0;
        $docSeq = 0;
        $married = [];

        $makeName = function (bool $isMale, string $surname) use (&$used, $male, $female): string {
            do {
                $name = $this->pick($isMale ? $male : $female).' '.$surname;
            } while (isset($used[$name]));
            $used[$name] = true;

            return $name;
        };

        $create = function (array $a) use (&$seq, $bloodType, $birthPlaces, $jobs, $churches, $ministers, &$docSeq, &$linkedUsers): Member {
            $seq++;
            $birth = Carbon::now()->subYears($a['age'])->subDays(mt_rand(0, 360));
            $age = $a['age'];
            $isMale = $a['gender'] === 'L';

            $status = $a['status'] ?? ($age < 17 ? 'anak' : 'tetap');
            $education = match (true) {
                $age < 6 => 'belum_sekolah', $age < 12 => 'sd', $age < 15 => 'smp', $age < 18 => 'sma',
                default => $this->pick(['sma', 'diploma', 's1', 's1', 's1', 's2']),
            };
            $nikDay = $birth->day + ($isMale ? 0 : 40);

            $member = Member::create([
                'member_number' => sprintf('JMT-%04d', $seq),
                'nik' => '3173'.sprintf('%02d', mt_rand(1, 20)).sprintf('%02d%02d%02d', $nikDay, $birth->month, $birth->year % 100).sprintf('%04d', 1000 + $seq),
                'name' => $a['name'],
                'gender' => $a['gender'],
                'place_of_birth' => $this->pick($birthPlaces),
                'birth_date' => $birth->toDateString(),
                'marital_status' => $a['marital'] ?? ($age < 22 ? 'belum_menikah' : 'menikah'),
                'education' => $education,
                'occupation' => $age < 6 ? null : ($age < 22 ? 'Pelajar/Mahasiswa' : ($age >= 62 ? 'Pensiunan' : $this->pick($jobs))),
                'father_name' => $a['father'] ?? null,
                'mother_name' => $a['mother'] ?? null,
                'phone' => $age < 12 ? null : '08'.$this->pick(['11', '12', '13', '21', '31', '51', '52', '56', '77', '81', '95']).mt_rand(1000000, 9999999),
                'email' => $age > 15 && $this->chance(55) ? strtolower(preg_replace('/[^a-z]/i', '', str_replace(' ', '.', $a['name']))).mt_rand(1, 99).'@'.$this->pick(['gmail.com', 'yahoo.co.id', 'outlook.com']) : null,
                'address' => $a['address'],
                'ktp_address' => $this->chance(80) ? $a['address'] : $this->pick(['Jl. Veteran No. 12, Medan', 'Jl. Merdeka No. 45, Bandung', 'Jl. Diponegoro No. 8, Surabaya', 'Jl. Sam Ratulangi No. 20, Manado']),
                'household_id' => $a['household']->id,
                'family_role' => $a['role'],
                'membership_status' => $status,
                'previous_church' => $a['previous_church'] ?? null,
                'emergency_name' => $a['emergency'][0] ?? null,
                'emergency_phone' => $a['emergency'][1] ?? null,
                'emergency_relation' => $a['emergency'][2] ?? null,
                'is_active' => ! in_array($status, ['pindah', 'meninggal'], true),
            ]);

            $first = $birth->copy()->addYears(match (true) { $age >= 15 => 17, default => 0 });
            // Peristiwa gerejawi
            $baptizedHere = $this->chance(72);
            if ($baptizedHere) {
                $member->milestones()->create(['type' => 'baptis_anak', 'date' => $birth->copy()->addMonths(mt_rand(3, 14))->toDateString(), 'church' => $this->chance(60) ? 'GKI Betlehem Sentosa' : $this->pick($churches), 'minister' => $this->pick($ministers), 'certificate_number' => 'BP/'.$birth->year.'/'.mt_rand(100, 999)]);
            } elseif ($age >= 15 && $status === 'tetap') {
                $member->milestones()->create(['type' => 'baptis_dewasa', 'date' => $birth->copy()->addYears(mt_rand(15, 30))->min(Carbon::now()->subYear())->toDateString(), 'church' => 'GKI Betlehem Sentosa', 'minister' => $this->pick($ministers), 'certificate_number' => 'BD/'.mt_rand(2005, 2024).'/'.mt_rand(10, 99)]);
            }
            $sidiDate = null;
            if ($age >= 17 && $status === 'tetap') {
                $sidiDate = $birth->copy()->addYears(mt_rand(17, 22))->min(Carbon::now()->subMonths(3));
                $member->milestones()->create(['type' => 'sidi', 'date' => $sidiDate->toDateString(), 'church' => 'GKI Betlehem Sentosa', 'minister' => $this->pick($ministers), 'certificate_number' => 'SD/'.$sidiDate->year.'/'.mt_rand(100, 999)]);
            }
            $joined = null;
            if (! empty($a['previous_church'])) {
                $joined = Carbon::now()->subYears(mt_rand(1, 14))->subDays(mt_rand(0, 300));
                $member->milestones()->create(['type' => 'atestasi_masuk', 'date' => $joined->toDateString(), 'church' => $a['previous_church'], 'certificate_number' => 'AT/'.$joined->year.'/'.mt_rand(10, 99)]);
            }
            $member->update(['membership_date' => ($joined ?? ($sidiDate ?? $birth->copy()->addMonths(6)))->toDateString()]);
            if ($status === 'pindah') {
                $member->milestones()->create(['type' => 'atestasi_keluar', 'date' => Carbon::now()->subMonths(mt_rand(2, 20))->toDateString(), 'church' => $this->pick($churches), 'certificate_number' => 'AK/'.mt_rand(2024, 2026).'/'.mt_rand(10, 99)]);
            }

            if ($age > 14 && $this->chance(70)) {
                AttributeValue::create(['attribute_definition_id' => $bloodType->id, 'entity_type' => 'member', 'entity_id' => $member->id, 'value_option' => $this->pick(['A', 'B', 'AB', 'O', 'O', 'B'])]);
            }

            // Pelayanan
            $ministry = function (string $key, ?string $title = null, int $yearsAgo = 3, bool $ended = false) use ($member) {
                $start = Carbon::now()->subYears($yearsAgo)->subMonths(mt_rand(0, 11));
                $member->ministries()->create(['ministry' => $key, 'role_title' => $title, 'start_date' => $start->toDateString(), 'end_date' => $ended ? $start->copy()->addYears(mt_rand(1, 2))->min(Carbon::now()->subMonth())->toDateString() : null]);
            };
            if ($status !== 'pindah' && $status !== 'meninggal') {
                if ($age < 12) {
                    $ministry('komisi_anak', 'Peserta', max(1, min($age, 5)));
                } elseif ($age < 18) {
                    $ministry('komisi_remaja', 'Anggota', 2);
                } elseif ($age <= 30 && $this->chance(55)) {
                    $ministry('komisi_pemuda', $this->chance(12) ? 'Ketua' : 'Anggota', mt_rand(1, 6));
                } elseif ($age >= 60 && $this->chance(60)) {
                    $ministry('komisi_lansia', 'Anggota', mt_rand(1, 8));
                } elseif ($age > 30 && ! $isMale && $this->chance(45)) {
                    $ministry('komisi_wanita', $this->chance(10) ? 'Bendahara' : 'Anggota', mt_rand(1, 10));
                } elseif ($age > 30 && $isMale && $this->chance(35)) {
                    $ministry('komisi_pria', 'Anggota', mt_rand(1, 10));
                }
                if ($age > 14 && $this->chance(14)) {
                    $ministry('paduan_suara', $this->pick(['Sopran', 'Alto', 'Tenor', 'Bass']), mt_rand(1, 9));
                }
                if ($age > 14 && $age < 45 && $this->chance(5)) {
                    $ministry('musik', $this->pick(['Pianis', 'Gitaris', 'Drummer', 'Pemain bass']), mt_rand(1, 5));
                }
                if ($age > 14 && $age < 50 && $this->chance(5)) {
                    $ministry('multimedia', 'Operator', mt_rand(1, 4));
                }
                if ($age > 20 && $this->chance(8)) {
                    $ministry('penyambut', 'Anggota', mt_rand(1, 6));
                }
                if ($age > 30 && $this->chance(6)) {
                    $ministry('diakonia', 'Anggota', mt_rand(1, 6));
                }
                if ($age > 35 && $this->chance(10)) {
                    $ministry('majelis', $this->pick(['Penatua', 'Penatua', 'Ketua Majelis', 'Sekretaris Majelis']), mt_rand(1, 8), $this->chance(35));
                } elseif ($age > 32 && $this->chance(7)) {
                    $ministry('diaken', $this->pick(['Diaken', 'Diaken', 'Ketua Diaken']), mt_rand(1, 8), $this->chance(30));
                }
            }

            // Dokumen
            $docs = [];
            if ($age >= 17 && $this->chance(82)) {
                $docs[] = ['ktp', 'KTP', null, null];
            }
            if ($a['role'] === 'kepala_keluarga' && $this->chance(85)) {
                $docs[] = ['kk', 'Kartu Keluarga', sprintf('317304%010d', mt_rand(1, 9999999999)), null];
            }
            if ($baptizedHere && $this->chance(75)) {
                $docs[] = ['surat_baptis', 'Surat Baptis', 'BP/'.$birth->year.'/'.mt_rand(100, 999), $birth->copy()->addMonths(6)->toDateString()];
            }
            if ($sidiDate && $this->chance(70)) {
                $docs[] = ['surat_sidi', 'Surat Sidi', 'SD/'.$sidiDate->year.'/'.mt_rand(100, 999), $sidiDate->toDateString()];
            }
            if ($joined && $this->chance(90)) {
                $docs[] = ['atestasi', 'Surat Atestasi dari '.$a['previous_church'], 'AT/'.$joined->year.'/'.mt_rand(10, 99), $joined->toDateString()];
            }
            if (($a['marital'] ?? 'menikah') === 'menikah' && $age >= 22 && $a['role'] === 'kepala_keluarga' && $this->chance(70)) {
                $docs[] = ['akta_nikah', 'Akta Nikah', 'AN/'.mt_rand(1995, 2024).'/'.mt_rand(100, 999), null];
            }
            foreach ($docs as [$type, $title, $number, $issued]) {
                $docSeq++;
                $path = "members/{$member->id}/documents/demo-{$docSeq}.pdf";
                Storage::disk('local')->put($path, file_get_contents(__DIR__.'/demo-assets/dokumen-demo.pdf'));
                $member->documents()->create([
                    'type' => $type, 'title' => $title, 'document_number' => $number, 'issued_date' => $issued, 'file_path' => $path,
                    'original_name' => str_replace(' ', '-', $title).'-'.str_replace(' ', '-', $member->name).'.pdf', 'mime' => 'application/pdf', 'size' => 760, 'uploaded_by' => $this->users['admin']->id,
                ]);
            }

            return $member;
        };

        $wilayahDefs = [
            ['A', 'Wilayah A', 'Kebon Jeruk dan sekitarnya', 'Jl. Kebon Jeruk Raya, Jl. Puri Indah, Perumahan Taman Kota', 'Persekutuan wilayah setiap Jumat pukul 19.00'],
            ['B', 'Wilayah B', 'Palmerah dan Duri Kepa', 'Jl. Palmerah Barat, Jl. Tanjung Duren, Duri Kepa', 'Persekutuan wilayah setiap Rabu pukul 19.30'],
            ['C', 'Wilayah C', 'Kembangan dan Meruya', 'Jl. Meruya Ilir, Jl. Kembangan Utara, Joglo', 'Persekutuan wilayah setiap Kamis pukul 19.00'],
            ['D', 'Wilayah D', 'Srengseng dan Green Garden', 'Jl. Srengseng Raya, Green Garden, Sukabumi Utara', 'Persekutuan wilayah minggu kedua dan keempat, Sabtu pukul 18.00'],
        ];
        $wilayahs = [];
        foreach ($wilayahDefs as [$code, $name, $description, $coverage, $meeting]) {
            $wilayahs[] = Wilayah::create(['code' => $code, 'name' => $name, 'description' => $description, 'coverage' => $coverage, 'meeting_info' => $meeting]);
        }
        $families = 0;
        while ($seq < 148) {
            $surname = $this->pick($surnames);
            $familyNo++;
            [$kelurahan, $kecamatan, $postal] = $this->pick($areas);
            $address = $this->pick($streets).' No. '.mt_rand(1, 120);
            $wilayah = $this->pick($wilayahs);
            $type = mt_rand(1, 100);

            $household = Household::create([
                'name' => 'Keluarga '.$surname,
                'family_number' => sprintf('KEL-%04d', $familyNo),
                'address' => $address,
                'rt_rw' => sprintf('%03d/%03d', mt_rand(1, 12), mt_rand(1, 15)),
                'kelurahan' => $kelurahan,
                'kecamatan' => $kecamatan,
                'city' => 'Jakarta Barat',
                'postal_code' => $postal,
                'housing_status' => $this->pick(['milik_sendiri', 'milik_sendiri', 'milik_sendiri', 'kontrak', 'kontrak', 'keluarga', 'kost']),
                'wilayah_id' => $wilayah->id,
                'phone' => '021-5'.mt_rand(100000, 999999),
            ]);
            $fullAddress = "{$address}, {$kelurahan}, {$kecamatan}, Jakarta Barat";
            $base = ['household' => $household, 'address' => $fullAddress];
            $families++;

            if ($type <= 62) { // keluarga inti: ayah, ibu, 0-3 anak
                $fatherAge = mt_rand(30, 68);
                $father = $makeName(true, $surname);
                $motherName = $makeName(false, $surname);
                $prev = $this->chance(22) ? $this->pick($churches) : null;
                $head = $create([...$base, 'name' => $father, 'gender' => 'L', 'age' => $fatherAge, 'role' => 'kepala_keluarga', 'marital' => 'menikah', 'previous_church' => $prev, 'emergency' => [$motherName, '08'.mt_rand(100000000, 999999999), 'Istri']]);
                $mother = $create([...$base, 'name' => $motherName, 'gender' => 'P', 'age' => max(26, $fatherAge - mt_rand(0, 6)), 'role' => 'pasangan', 'marital' => 'menikah', 'previous_church' => $prev, 'emergency' => [$father, $head->phone, 'Suami']]);
                $married[] = [$head, $mother];
                $kids = $fatherAge < 36 ? mt_rand(0, 2) : mt_rand(0, 3);
                for ($k = 0; $k < $kids && $seq < 148; $k++) {
                    $kidAge = max(0, $fatherAge - mt_rand(24, 38));
                    if ($kidAge < 0 || $kidAge > 40) {
                        continue;
                    }
                    $kidMale = $this->chance(50);
                    $create([...$base, 'name' => $makeName($kidMale, $surname), 'gender' => $kidMale ? 'L' : 'P', 'age' => $kidAge, 'role' => 'anak', 'marital' => $kidAge > 28 && $this->chance(40) ? 'menikah' : 'belum_menikah', 'father' => $father, 'mother' => $motherName, 'emergency' => [$father, $head->phone, 'Ayah']]);
                }
            } elseif ($type <= 80) { // lajang atau pelajar
                $isMale = $this->chance(50);
                $create([...$base, 'name' => $makeName($isMale, $surname), 'gender' => $isMale ? 'L' : 'P', 'age' => mt_rand(19, 38), 'role' => 'kepala_keluarga', 'marital' => 'belum_menikah', 'previous_church' => $this->chance(30) ? $this->pick($churches) : null, 'emergency' => ['Orang tua', '08'.mt_rand(100000000, 999999999), 'Orang tua']]);
            } elseif ($type <= 92) { // lansia, mungkin janda/duda
                $isMale = $this->chance(40);
                $head = $create([...$base, 'name' => $makeName($isMale, $surname), 'gender' => $isMale ? 'L' : 'P', 'age' => mt_rand(66, 88), 'role' => 'kepala_keluarga', 'marital' => 'cerai_mati', 'emergency' => ['Anak kandung', '08'.mt_rand(100000000, 999999999), 'Anak']]);
                if ($this->chance(50) && $seq < 148) {
                    $create([...$base, 'name' => $makeName(! $isMale, $surname), 'gender' => $isMale ? 'P' : 'L', 'age' => $head->age + mt_rand(-5, 5), 'role' => 'pasangan', 'marital' => 'menikah', 'emergency' => ['Anak kandung', '08'.mt_rand(100000000, 999999999), 'Anak']]);
                    $head->update(['marital_status' => 'menikah']);
                }
            } else { // simpatisan / tamu
                $isMale = $this->chance(50);
                $create([...$base, 'name' => $makeName($isMale, $surname), 'gender' => $isMale ? 'L' : 'P', 'age' => mt_rand(24, 55), 'role' => 'kepala_keluarga', 'marital' => $this->pick(['menikah', 'belum_menikah']), 'status' => $this->pick(['simpatisan', 'simpatisan', 'tamu']), 'previous_church' => $this->pick($churches)]);
            }
        }

        // Pemberkatan nikah untuk pasangan yang tercatat.
        foreach ($married as [$head, $spouse]) {
            if (! $this->chance(88)) {
                continue;
            }
            $date = Carbon::now()->subYears(max(1, $head->age - mt_rand(24, 34)))->subDays(mt_rand(0, 300));
            foreach ([$head, $spouse] as $partner) {
                $partner->milestones()->create(['type' => 'pemberkatan_nikah', 'date' => $date->toDateString(), 'church' => $this->chance(65) ? 'GKI Betlehem Sentosa' : $this->pick($churches), 'minister' => $this->pick($ministers), 'certificate_number' => 'PN/'.$date->year.'/'.mt_rand(100, 999), 'civil_number' => '3173-KW-'.$date->format('Ymd').'-'.mt_rand(1000, 9999)]);
            }
        }

        // Dua kasus khusus agar status pindah dan meninggal ada contohnya.
        $adults = Member::where('membership_status', 'tetap')->where('family_role', '!=', 'kepala_keluarga')->whereNull('user_id')->orderBy('id', 'desc')->get();
        if ($adults->count() >= 2) {
            $adults[0]->update(['membership_status' => 'pindah', 'is_active' => false]);
            $adults[0]->milestones()->create(['type' => 'atestasi_keluar', 'date' => Carbon::now()->subMonths(5)->toDateString(), 'church' => 'GKI Pondok Indah', 'certificate_number' => 'AK/2026/17']);
            $adults[1]->update(['membership_status' => 'meninggal', 'is_active' => false]);
        }

        // Hubungkan 8 jemaat dewasa aktif ke akun portal.
        $candidates = Member::where('is_active', true)->where('membership_status', 'tetap')->whereNull('user_id')->orderBy('id')->take(8)->get();
        foreach ($candidates as $i => $member) {
            $member->update(['user_id' => $linkedUsers[$i]->id]);
            $linkedUsers[$i]->forceFill(['name' => $member->name])->save();
        }

        // Pengurus wilayah: penatua (sintua), diaken, ketua, sekretaris, dan bendahara per wilayah.
        $roles = [['penatua', 2], ['diaken', 2], ['ketua', 1], ['sekretaris', 1], ['bendahara', 1]];
        foreach ($wilayahs as $wilayah) {
            $pool = Member::whereHas('household', fn ($q) => $q->where('wilayah_id', $wilayah->id))
                ->where('is_active', true)->where('membership_status', 'tetap')->get()
                ->filter(fn (Member $m) => $m->age >= 30 && $m->age <= 72)->shuffle(mt_rand())->values();
            $i = 0;
            foreach ($roles as [$role, $count]) {
                for ($n = 0; $n < $count && $i < $pool->count(); $n++, $i++) {
                    $member = $pool[$i];
                    $start = Carbon::now()->subYears(mt_rand(1, 4))->subMonths(mt_rand(0, 11));
                    $wilayah->officers()->create(['member_id' => $member->id, 'role' => $role, 'start_date' => $start->toDateString()]);
                    if (in_array($role, ['penatua', 'diaken'], true) && ! $member->ministries()->where('ministry', $role === 'penatua' ? 'majelis' : 'diaken')->exists()) {
                        $member->ministries()->create(['ministry' => $role === 'penatua' ? 'majelis' : 'diaken', 'role_title' => $role === 'penatua' ? 'Penatua wilayah' : 'Diaken wilayah', 'start_date' => $start->toDateString()]);
                    }
                }
            }
            // Satu penatua periode sebelumnya sudah selesai, sebagai riwayat.
            if ($i < $pool->count()) {
                $former = $pool[$i];
                $from = Carbon::now()->subYears(7);
                $wilayah->officers()->create(['member_id' => $former->id, 'role' => 'penatua', 'start_date' => $from->toDateString(), 'end_date' => $from->copy()->addYears(3)->toDateString(), 'notes' => 'Purna tugas, masa pelayanan periode sebelumnya.']);
            }
        }

        $this->members = Member::all()->all();
        $this->tithers = Member::where('is_active', true)->where('membership_status', 'tetap')->whereNotNull('phone')->get()->filter(fn (Member $m) => $m->age >= 22 && $m->age <= 72)->shuffle(mt_rand())->take(52)->values()->all();
    }

    // ------------------------------------------------------------------ periode & saldo awal

    private function periods(): void
    {
        $this->as($this->users['admin']);
        foreach (CarbonPeriod::create(self::START, '1 month', $this->today->copy()->startOfMonth()) as $start) {
            $start = Carbon::instance($start);
            AccountingPeriod::create(['name' => $start->translatedFormat('F Y'), 'start_date' => $start->toDateString(), 'end_date' => $start->copy()->endOfMonth()->toDateString()]);
        }
    }

    private function openingBalances(): void
    {
        $this->at(Carbon::parse(self::START), 8);
        $this->as($this->users['bendahara']);
        $period = AccountingPeriod::orderBy('start_date')->firstOrFail();
        $service = app(AccountingPeriodService::class);

        foreach ([
            ['KAS', 'UMUM', 4_500_000], ['KK', 'UMUM', 7_500_000], ['BCA', 'UMUM', 38_000_000], ['BCA', 'DIAK', 9_500_000],
            ['BCA', 'BEAS', 9_000_000], ['BCA', 'KOMS', 5_000_000], ['MDR', 'PEMB', 120_000_000],
        ] as [$account, $fund, $amount]) {
            $service->recordOpeningBalance($period, [
                'account_id' => $this->accounts[$account]->id, 'fund_id' => $this->funds[$fund]->id, 'amount' => $amount,
                'date' => self::START, 'description' => 'Saldo awal pembukuan',
            ]);
        }
    }

    // ------------------------------------------------------------------ per bulan

    /** @param array<string, Event> $events */
    private function month(Carbon $start, array $events): void
    {
        $end = $start->copy()->endOfMonth()->min($this->today);

        foreach (CarbonPeriod::create($start, $end) as $day) {
            $day = Carbon::instance($day);
            if ($day->isSunday()) {
                $this->sunday($day);
            }
            $this->specialServices($day);
        }

        $this->monthlyExpenses($start, $end);
        $this->monthlyTransfers($start, $end);
        $this->eventActivity($start, $end, $events);
    }

    // ------------------------------------------------------------------ kolekte mingguan

    private function season(Carbon $date): float
    {
        return match (true) {
            $date->month === 12 => 1.7,
            $date->month === 4 && $date->day <= 12 => 1.35,
            in_array($date->month, [6, 7], true) => 0.88,
            $date->month === 1 => 0.95,
            default => 1.0,
        };
    }

    private function sunday(Carbon $date): void
    {
        $nth = (int) ceil($date->day / 7);
        $sessions = [['Ibadah Umum I', 7, 30, 0.8, false], ['Ibadah Umum II', 10, 0, 1.2, true]];
        if (in_array($nth, [1, 3], true)) {
            $sessions[] = ['Ibadah Pemuda', 17, 0, 0.35, false];
        }

        $isPaskah = $date->toDateString() === '2026-04-05';
        $latest = $date->diffInDays($this->today) < 8 && $date->greaterThan($this->today->copy()->subDays(8));

        foreach ($sessions as $i => [$name, $h, $m, $weight, $main]) {
            if ($isPaskah) {
                $name = str_replace('Ibadah Umum', 'Ibadah Paskah', $name);
            }
            $status = 'locked';
            if ($latest) {
                $status = match ($name) {
                    'Ibadah Umum I', 'Ibadah Paskah I' => 'draft',
                    'Ibadah Umum II', 'Ibadah Paskah II' => 'confirmed',
                    default => 'locked',
                };
            } elseif ($date->toDateString() === $this->lastSunday($this->today, 1)) {
                $status = $name === 'Ibadah Umum II' ? 'verified' : 'locked';
            }

            $this->service($date, $name, $h, $m, $weight, $main, $nth === 1, $status, $this->schedules[$name] ?? null);
        }
    }

    private function lastSunday(Carbon $from, int $weeksBack): string
    {
        $d = $from->copy();
        while (! $d->isSunday()) {
            $d->subDay();
        }

        return $d->subWeeks($weeksBack)->toDateString();
    }

    private function specialServices(Carbon $day): void
    {
        $special = [
            '2025-12-24' => ['Ibadah Malam Natal', 19, 3.0], '2025-12-25' => ['Ibadah Natal', 9, 3.4], '2025-12-31' => ['Ibadah Akhir Tahun', 19, 1.6],
            '2026-01-01' => ['Ibadah Tahun Baru', 9, 1.4], '2026-04-03' => ['Ibadah Jumat Agung', 9, 2.0], '2026-05-14' => ['Ibadah Kenaikan Isa Almasih', 9, 0.9],
        ];
        if (isset($special[$day->toDateString()])) {
            [$name, $hour, $weight] = $special[$day->toDateString()];
            $this->service($day, $name, $hour, 0, $weight, true, false, 'locked', null);
        }
    }

    private function service(Carbon $date, string $name, int $h, int $m, float $weight, bool $main, bool $firstSunday, string $status, ?ServiceSchedule $schedule): void
    {
        $this->at($date, $h, $m + 5);
        $session = ServiceSession::create(['service_schedule_id' => $schedule?->id, 'date' => $date->toDateString(), 'name' => $name.' - '.$date->translatedFormat('j M Y'), 'is_completed' => false]);

        $penghitung = $this->shuffle(['penghitung', 'penghitung2', 'penghitung3']);
        $creator = $this->users[$penghitung[0]];
        $this->at($date, $h + 2, 20);
        $this->as($creator);

        $mult = $this->season($date) * $weight * mt_rand(86, 116) / 100;
        $raw = [];
        $named = [];

        $raw[] = $this->cashLine('Kolekte', (int) round($this->rand(850_000, 2_100_000, 500) * $mult / 500) * 500, 'kolekte');

        if ($main && $this->chance(62)) {
            $donors = $this->donors(mt_rand(1, 3), [100_000, 450_000]);
            $anon = $this->rand(50_000, 300_000, 5_000);
            $raw[] = $this->cashLine('Persembahan Syukur', array_sum(array_column($donors, 1)) + $anon, 'amplop');
            $named['Persembahan Syukur'] = $donors;
        }
        if ($main) {
            $donors = $this->donors(mt_rand(5, 9), [200_000, 1_000_000]);
            $anon = $this->rand(250_000, 800_000, 5_000);
            $raw[] = $this->cashLine('Perpuluhan', array_sum(array_column($donors, 1)) + $anon, 'amplop');
            $named['Perpuluhan'] = $donors;
            if ($this->chance(70)) {
                $raw[] = $this->cashLine('Persembahan Pembangunan', $this->rand(200_000, 1_000_000, 5_000), 'amplop');
            }
        }
        if ($firstSunday && $main) {
            $raw[] = $this->cashLine('Diakonia', $this->rand(300_000, 800_000, 5_000), 'amplop');
        }
        if ($date->toDateString() >= '2025-12-20' && $date->toDateString() <= '2025-12-25') {
            $raw[] = $this->cashLine('Persembahan Natal', $this->rand(3_000_000, 7_000_000, 5_000), 'amplop');
        }
        if (in_array($date->toDateString(), ['2026-04-03', '2026-04-05'], true)) {
            $raw[] = $this->cashLine('Persembahan Paskah', $this->rand(1_500_000, 3_500_000, 5_000), 'amplop');
        }
        if ($main && $firstSunday && $this->chance(45)) {
            $raw[] = [
                'category_id' => $this->inCats['Perpuluhan']->id, 'is_cash' => false, 'amount' => $this->rand(1_500_000, 4_500_000, 50_000),
                'reference_number' => 'TRF-'.$date->format('Ymd').'-'.mt_rand(1000, 9999),
            ];
        }

        $calc = app(CountCalculationService::class)->calculate($raw);
        $sheet = CountSheet::create([
            'type' => CountSheetType::Service, 'service_session_id' => $session->id, 'account_id' => $this->accounts['KAS']->id, 'date' => $date->toDateString(),
            'status' => CountSheetStatus::Draft, 'total_amount' => $calc['total_amount'], 'created_by' => $creator->id,
            'notes' => $this->chance(12) ? $this->pick(['Hitungan diperiksa dua kali.', 'Ada uang logam dalam jumlah banyak.', 'Amplop persembahan syukur dihitung terpisah.']) : null,
        ]);
        $lineIds = [];
        foreach ($calc['lines'] as $line) {
            $row = CountLine::create(['count_sheet_id' => $sheet->id, 'category_id' => $line['category_id'], 'is_cash' => $line['is_cash'], 'denomination_counts' => $line['denomination_counts'], 'amount' => $line['amount'], 'reference_number' => $line['reference_number']]);
            $lineIds[$line['category_id']] = $row;
        }

        foreach ($named as $categoryName => $donors) {
            foreach ($donors as [$member, $amount]) {
                $this->at($date, $h + 3, mt_rand(0, 50));
                Donation::create([
                    'count_sheet_id' => $sheet->id, 'member_id' => $member->id, 'category_id' => $this->inCats[$categoryName]->id, 'amount' => $amount,
                    'payment_method' => $this->pick(['cash', 'cash', 'cash', 'cash', 'cash', 'transfer', 'qris']), 'receipt_number' => Donation::generateReceiptNumber(),
                    'notes' => $categoryName === 'Persembahan Syukur' ? $this->pick(['Syukur ulang tahun', 'Syukur kelulusan', 'Syukur kesembuhan', 'Syukur pernikahan', 'Syukur pekerjaan baru', null]) : null,
                ]);
            }
        }

        $this->progressSheet($sheet, $session, $date, $status, $penghitung);
    }

    /** @param list<string> $witnessKeys */
    private function progressSheet(CountSheet $sheet, ?ServiceSession $session, Carbon $date, string $status, array $witnessKeys, ?Carbon $verifiedAt = null): void
    {
        if ($status === 'draft') {
            $this->at($date, 13, 10);
            CountConfirmation::create(['count_sheet_id' => $sheet->id, 'user_id' => $this->users[$witnessKeys[1]]->id, 'confirmed_at' => now()]);

            return;
        }

        foreach ([1, 2] as $n) {
            $this->at($date, 13, 10 * $n);
            CountConfirmation::create(['count_sheet_id' => $sheet->id, 'user_id' => $this->users[$witnessKeys[$n - 1]]->id, 'confirmed_at' => now()]);
        }
        $sheet->update(['status' => CountSheetStatus::Confirmed]);

        if ($status === 'confirmed') {
            return;
        }

        $verifyDay = ($verifiedAt ?? $date->copy()->addDay())->min($this->today);
        $this->at($verifyDay, 9, 30);
        $this->as($this->users['bendahara']);
        $sheet->update(['status' => CountSheetStatus::Verified]);

        if ($status === 'verified') {
            return;
        }

        $this->at($verifyDay, 10, 15);
        app(AllocationService::class)->apply($sheet->fresh());
        $session?->update(['is_completed' => true]);

        $this->maybeDeposit($verifyDay);
    }

    /** @return array{category_id: int, is_cash: bool, denomination_counts: array<string, int>, amount: int} */
    private function cashLine(string $category, int $amount, string $style): array
    {
        $amount = max(50_000, (int) (round($amount / 500) * 500));

        return ['category_id' => $this->inCats[$category]->id, 'is_cash' => true, 'denomination_counts' => $this->denominations($amount, $style)];
    }

    /** @return array<string, int> */
    private function denominations(int $amount, string $style): array
    {
        $denoms = [100_000, 50_000, 20_000, 10_000, 5_000, 2_000, 1_000, 500];
        $bias = $style === 'kolekte'
            ? [[0, 12], [10, 35], [30, 70], [40, 80], [55, 90], [60, 95], [80, 100]]
            : [[20, 70], [30, 70], [40, 80], [40, 80], [50, 90], [60, 95], [90, 100]];
        $remaining = $amount;
        $counts = [];
        foreach ($denoms as $i => $d) {
            $max = intdiv($remaining, $d);
            $count = $i === count($denoms) - 1 ? $max : (int) round($max * mt_rand(...$bias[$i]) / 100);
            if ($count > 0) {
                $counts[(string) $d] = $count;
            }
            $remaining -= $count * $d;
        }

        return $counts;
    }

    /** @return list<array{0: Member, 1: int}> */
    private function donors(int $count, array $range): array
    {
        $pool = $this->shuffle($this->tithers);
        $donors = [];
        foreach (array_slice($pool, 0, $count) as $member) {
            $donors[] = [$member, $this->rand($range[0], $range[1], 10_000)];
        }

        return $donors;
    }

    private function shuffle(array $items): array
    {
        $keys = array_keys($items);
        for ($i = count($keys) - 1; $i > 0; $i--) {
            $j = mt_rand(0, $i);
            [$keys[$i], $keys[$j]] = [$keys[$j], $keys[$i]];
        }

        return array_map(fn ($k) => $items[$k], $keys);
    }

    private function maybeDeposit(Carbon $date): void
    {
        if (! $date->isMonday() || ! in_array((int) ceil($date->day / 7), [2, 4], true)) {
            return;
        }
        $cash = LedgerEntry::getAccountBalance($this->accounts['KAS']->id);
        $amount = (int) (floor(($cash - 2_000_000) * 0.92 / 100_000) * 100_000);
        if ($amount < 3_000_000) {
            return;
        }

        $this->at($date, 11, 0);
        $this->as($this->users['bendahara']);
        $deposit = BankDeposit::create([
            'deposit_date' => $date->toDateString(), 'from_account_id' => $this->accounts['KAS']->id, 'to_account_id' => $this->accounts['BCA']->id, 'amount' => $amount,
            'reference_number' => 'STR-'.$date->format('ymd').'-'.mt_rand(100, 999), 'notes' => 'Setoran kolekte ke rekening operasional', 'status' => 'completed', 'created_by' => $this->users['bendahara']->id,
        ]);
        foreach ([[$this->accounts['KAS'], Direction::Out, 'keluar dari'], [$this->accounts['BCA'], Direction::In, 'masuk di']] as [$account, $direction, $verb]) {
            LedgerService::record([
                'entry_date' => $date->toDateString(), 'account_id' => $account->id, 'fund_id' => $this->funds['UMUM']->id, 'amount' => $amount, 'direction' => $direction,
                'description' => "Setoran Bank: Transfer {$verb} {$account->name} (Ref: {$deposit->reference_number})", 'source_type' => 'bank_deposit', 'source_id' => $deposit->id,
                'idempotency_key' => "dep-{$deposit->id}-".$direction->value,
            ]);
        }
    }

    // ------------------------------------------------------------------ pengeluaran

    private function monthlyExpenses(Carbon $start, Carbon $end): void
    {
        $m = $start->month;
        $fixed = [
            [3, 'PT PLN (Persero)', 'Tagihan listrik gedung gereja', $this->rand(1_750_000, 2_650_000, 5_000), 'Listrik & Air', null, 'BCA', 'bendahara'],
            [4, 'PDAM Jaya', 'Tagihan air bulanan', $this->rand(320_000, 640_000, 5_000), 'Listrik & Air', null, 'BCA', 'bendahara'],
            [5, 'Telkom Indihome', 'Internet dan telepon sekretariat', 650_000, 'Operasional', null, 'BCA', 'penghitung'],
            [25, 'Pdt. Daniel Simanjuntak', 'Honor pendeta bulanan', 7_500_000, 'Honor', null, 'BCA', 'penghitung'],
            [25, 'Sdri. Natalia Rumbayan', 'Honor organis', 2_400_000, 'Honor', null, 'BCA', 'penghitung'],
            [25, 'Bpk. Sugeng Hartono', 'Honor koster dan kebersihan', 2_100_000, 'Honor', null, 'BCA', 'penghitung'],
            [28, 'Sinode GKI Wilayah Jakarta', 'Iuran sinode dan klasis bulanan', 6_500_000, 'Operasional', null, 'BCA', 'bendahara'],
            [27, 'Tim Musik & Multimedia', 'Honor pelayan ibadah', 1_800_000, 'Honor', null, 'BCA', 'bendahara'],
        ];
        $variable = [];
        $variable[] = [$this->rand(6, 9), 'Toko Buku Kasih', 'Cetak warta jemaat dan ATK', $this->rand(380_000, 950_000, 5_000), 'Operasional', null, 'KK', 'penghitung'];
        $variable[] = [$this->rand(2, 6), 'Katering Berkat', 'Konsumsi Perjamuan Kudus', $this->rand(850_000, 1_500_000, 5_000), 'Konsumsi & Perjamuan', null, 'BCA', 'penghitung2'];
        $variable[] = [$this->rand(10, 22), 'CV Servis Prima', $this->pick(['Servis AC ruang ibadah', 'Perbaikan sound system', 'Pengecatan pagar dan kanopi', 'Perbaikan atap bocor', 'Penggantian lampu sorot']), $this->rand(650_000, 3_800_000, 10_000), 'Pemeliharaan Gedung', null, 'BCA', 'bendahara'];
        $variable[] = [$this->rand(8, 20), 'Toko Alat Ibadah Sion', $this->pick(['Anggur dan roti perjamuan', 'Lilin dan perlengkapan altar', 'Jubah paduan suara', 'Alkitab dan buku nyanyian']), $this->rand(300_000, 1_450_000, 5_000), 'Perlengkapan Ibadah', null, 'KK', 'penghitung3'];
        for ($i = 0, $n = mt_rand(2, 3); $i < $n; $i++) {
            $variable[] = [$this->rand(6, 26), $this->pick(['Ibu Anita Sinaga', 'Bpk. Maruli Gultom', 'Ibu Lasma Purba', 'Keluarga Bpk. Elias Kalalo', 'Ibu Tiur Hutagalung']), $this->pick(['Bantuan biaya rumah sakit jemaat', 'Santunan duka', 'Bantuan sembako keluarga prasejahtera', 'Bantuan biaya sekolah anak jemaat']), $this->rand(600_000, 2_600_000, 50_000), 'Diakonia', 'DIAK', 'BCA', 'bendahara'];
        }
        if ($this->chance(75)) {
            $variable[] = [$this->rand(9, 24), $this->pick(['Komisi Pemuda', 'Komisi Anak', 'Persekutuan Wanita', 'Persekutuan Pria', 'Komisi Lansia']), 'Dana kegiatan komisi pelayanan', $this->rand(900_000, 3_200_000, 50_000), 'Kegiatan Komisi', 'KOMS', 'BCA', 'penghitung'];
        }
        if ($this->chance(60)) {
            $variable[] = [$this->rand(1, 24), $this->pick(['Pdt. Samuel Wijaya', 'Pdt. Ev. Rahel Gunawan', 'Pdt. Markus Hidayat']), 'Honor dan transport pelayan firman tamu', $this->rand(800_000, 2_400_000, 50_000), 'Transportasi & Akomodasi', null, 'BCA', 'penghitung2'];
        }
        if ($m === 8) {
            $variable[] = [20, 'Bapenda DKI Jakarta', 'Pajak Bumi dan Bangunan gedung gereja', 4_250_000, 'Operasional', null, 'BCA', 'bendahara'];
        }
        if ($m === 2) {
            $variable[] = [12, 'PT Multimedia Solusi', 'Pembelian proyektor dan layar ruang ibadah', 14_800_000, 'Perlengkapan Ibadah', null, 'BCA', 'penghitung'];
        }
        if (in_array($m, [1, 7], true)) {
            foreach (['Yosua Tambunan', 'Rachel Situmorang', 'Imanuel Sihombing', 'Natasya Panjaitan'] as $student) {
                $variable[] = [$this->rand(12, 16), $student, 'Beasiswa pendidikan semester', 1_500_000, 'Beasiswa', 'BEAS', 'BCA', 'bendahara'];
            }
        }
        if ($m === 12) {
            $variable[] = [18, 'Event Organizer Cahaya', 'Dekorasi dan tata panggung Natal', 4_650_000, 'Perlengkapan Ibadah', null, 'BCA', 'panitia'];
        }
        if (in_array($m, [1, 2, 3, 4], true)) {
            $variable[] = [$m === 1 ? 12 : 20, 'PT Cipta Karya Bangunan', "Termin renovasi atap dan plafon gedung ibadah - bulan {$m}", 18_500_000, 'Pembangunan & Renovasi', 'PEMB', 'MDR', 'bendahara'];
        }

        $all = array_merge($fixed, $variable);
        usort($all, fn ($a, $b) => $a[0] <=> $b[0]);
        foreach ($all as [$day, $payee, $desc, $amount, $category, $fund, $account, $submitter]) {
            $date = $start->copy()->day(min($day, $start->daysInMonth));
            if ($date->greaterThan($end)) {
                continue;
            }
            $this->expense($date, $payee, $desc, $amount, $category, $fund, $account, $submitter);
        }
    }

    private function expense(Carbon $date, string $payee, string $desc, int $amount, string $category, ?string $fund, string $account, string $submitterKey, ?int $eventId = null, ?int $fundId = null, string $forceStatus = 'auto'): ?Expense
    {
        $cat = $this->outCats[$category];
        $fundId ??= $fund ? $this->funds[$fund]->id : $cat->default_fund_id;
        $accountModel = $this->accounts[$account];

        $service = app(ExpenseService::class);
        $threshold = (int) ChurchSetting::current()->expense_approval_threshold;
        $submitter = $this->users[$submitterKey];
        $approver = $amount > $threshold ? $this->users['majelis'] : ($submitterKey === 'bendahara' ? $this->users['majelis2'] : $this->users['bendahara']);
        $affordable = LedgerEntry::getBalance($fundId) >= $amount && LedgerEntry::getAccountBalance($accountModel->id) >= $amount;

        $isCurrent = $date->greaterThan($this->today->copy()->subDays(9));
        $status = $forceStatus !== 'auto' ? $forceStatus : ($isCurrent ? $this->pick(['pending', 'pending', 'approved', 'paid']) : ($this->chance(4) ? 'rejected' : 'paid'));
        if (! $affordable && in_array($status, ['approved', 'paid'], true)) {
            $this->skipped++;

            return null;
        }

        try {
            $this->at($date, mt_rand(8, 15));
            $this->as($submitter);
            $data = ['payee' => $payee, 'amount' => $amount, 'date' => $date->toDateString(), 'account_id' => $accountModel->id, 'fund_id' => $fundId, 'category_id' => $cat->id, 'event_id' => $eventId, 'description' => $desc];
            $expense = $service->submit($data, $submitter, 'expenses/nota-demo.pdf');

            if ($status === 'pending') {
                return $expense;
            }
            $this->at($date->copy()->addDay()->min($this->today), 9, mt_rand(0, 59));
            $this->as($approver);
            if ($status === 'rejected') {
                $service->reject($expense, $approver, $this->pick(['Nota tidak lengkap, mohon lampirkan kuitansi asli.', 'Nominal melebihi anggaran bulan ini.', 'Pengeluaran belum dibahas di rapat majelis.']));

                return $expense;
            }
            $service->approve($expense, $approver, $this->chance(30) ? 'Disetujui sesuai anggaran.' : null);
            if ($status === 'approved') {
                return $expense;
            }
            $this->at($date->copy()->addDays(2)->min($this->today), 10, mt_rand(0, 59));
            $this->as($this->users['bendahara']);
            $service->pay($expense, $this->users['bendahara']);

            return $expense;
        } catch (Throwable $e) {
            $this->skipped++;
            $this->command?->warn("Lewati pengeluaran {$payee} ({$this->rupiah($amount)}): ".($e instanceof ValidationException ? collect($e->errors())->flatten()->first() : $e->getMessage()));

            return null;
        }
    }

    // ------------------------------------------------------------------ pindah dana

    private function monthlyTransfers(Carbon $start, Carbon $end): void
    {
        $plan = [
            '2025-12' => [['UMUM', 'PEMB', 10_000_000, 'Penguatan dana pembangunan dari surplus kas umum', 'paid', 18], ['UMUM', 'KOMS', 3_000_000, 'Subsidi kegiatan komisi akhir tahun', 'paid', 20]],
            '2026-03' => [['UMUM', 'KOMS', 3_500_000, 'Subsidi kegiatan komisi triwulan pertama', 'paid', 11]],
            '2026-06' => [['UMUM', 'KOMS', 3_500_000, 'Subsidi kegiatan komisi triwulan kedua', 'paid', 10]],
            '2026-02' => [['UMUM', 'DIAK', 5_000_000, 'Tambahan dana diakonia menjelang Paskah', 'paid', 9]],
            '2026-05' => [['UMUM', 'BEAS', 7_000_000, 'Pengisian dana beasiswa tahun ajaran baru', 'paid', 12]],
            '2026-07' => [['DIAK', 'UMUM', 2_000_000, 'Pengembalian dana talangan operasional', 'rejected', 8]],
            '2026-09' => [['UMUM', 'PEMB', 12_000_000, 'Penguatan dana pembangunan aula', 'paid', 14], ['UMUM', 'KOMS', 3_000_000, 'Subsidi kegiatan komisi triwulan ketiga', 'paid', 15]],
            '2026-10' => [['UMUM', 'DIAK', 4_000_000, 'Persiapan bakti sosial akhir tahun', 'pending', 19]],
        ];
        foreach ($plan[$start->format('Y-m')] ?? [] as [$from, $to, $amount, $reason, $status, $day]) {
            $date = $start->copy()->day($day);
            if ($date->greaterThan($end)) {
                continue;
            }
            $service = app(FundTransferService::class);
            $this->at($date, 9);
            $this->as($this->users['bendahara']);
            $transfer = $service->request([
                'from_fund_id' => $this->funds[$from]->id, 'to_fund_id' => $this->funds[$to]->id, 'account_id' => $this->accounts['BCA']->id,
                'amount' => $amount, 'transfer_date' => $date->toDateString(), 'reason' => $reason,
            ], $this->users['bendahara']);
            if ($status === 'pending') {
                continue;
            }
            $this->at($date->copy()->addDay(), 14);
            $this->as($this->users['majelis']);
            if ($status === 'rejected') {
                $service->reject($transfer, $this->users['majelis'], 'Ditunda sampai laporan triwulan selesai dibahas.');
            } else {
                $service->approve($transfer, $this->users['majelis'], 'Disetujui dalam rapat majelis.');
            }
        }
    }

    // ------------------------------------------------------------------ acara

    /** @return array<string, Event> */
    private function events(): array
    {
        $this->as($this->users['admin']);
        $defs = [
            'natal' => ['Natal 2025', 'Hadir dan Damai di Tengah Kita', '2025-12-14', '2025-12-25', 'completed', 32_000_000, 'Rangkaian perayaan Natal jemaat: ibadah, pentas anak, dan bingkisan diakonia.'],
            'paskah' => ['Paskah 2026', 'Bangkit dan Berharap', '2026-04-03', '2026-04-05', 'completed', 14_000_000, 'Ibadah Jumat Agung, kebaktian subuh Paskah, dan sarapan bersama.'],
            'retreat' => ['Retreat Pemuda 2026', 'Berakar dan Bertumbuh', '2026-06-12', '2026-06-14', 'completed', 38_000_000, 'Retreat tiga hari dua malam untuk pemuda di Puncak.'],
            'aula' => ['Pembangunan Aula Serbaguna', 'Rumah Bersama untuk Semua', '2026-01-10', '2026-12-20', 'active', 240_000_000, 'Penggalangan dana dan pembangunan aula serbaguna di samping gedung ibadah.'],
            'bazaar' => ['Bazaar Persekutuan Wanita 2026', 'Berbagi Berkat', '2026-11-07', '2026-11-07', 'active', 12_000_000, 'Bazaar tahunan; hasilnya untuk dana diakonia.'],
            'baksos' => ['Bakti Sosial Diakonia 2026', 'Mengasihi Sesama', '2026-10-24', '2026-10-25', 'planning', 9_000_000, 'Pembagian sembako dan layanan kesehatan gratis untuk warga sekitar.'],
        ];
        $events = [];
        foreach ($defs as $key => [$name, $theme, $start, $end, $status, $budget, $description]) {
            $this->at(Carbon::parse($start)->subDays(40), 9);
            $events[$key] = Event::create(['name' => $name, 'theme' => $theme, 'start_date' => $start, 'end_date' => $end, 'status' => 'planning', 'target_budget' => $budget, 'description' => $description]);
            $this->eventTarget[$key] = $status;
        }

        $roster = [
            'natal' => ['panitia' => EventRole::Ketua, 'panitia2' => EventRole::Sekretaris, 'bendahara' => EventRole::Bendahara],
            'paskah' => ['panitia2' => EventRole::Ketua, 'panitia' => EventRole::Sekretaris, 'bendahara' => EventRole::Bendahara],
            'retreat' => ['panitia' => EventRole::Ketua, 'penghitung3' => EventRole::Sekretaris, 'bendahara' => EventRole::Bendahara],
            'aula' => ['majelis2' => EventRole::Ketua, 'panitia' => EventRole::Sekretaris, 'bendahara' => EventRole::Bendahara],
            'bazaar' => ['panitia2' => EventRole::Ketua, 'penghitung' => EventRole::Sekretaris, 'bendahara' => EventRole::Bendahara],
            'baksos' => ['panitia' => EventRole::Ketua, 'panitia2' => EventRole::Sekretaris, 'bendahara' => EventRole::Bendahara],
        ];
        foreach ($roster as $key => $team) {
            foreach ($team as $userKey => $role) {
                EventMember::create(['event_id' => $events[$key]->id, 'user_id' => $this->users[$userKey]->id, 'role_in_event' => $role->value]);
            }
            foreach (array_slice($this->shuffle($this->members), 0, mt_rand(5, 9)) as $member) {
                EventMember::create(['event_id' => $events[$key]->id, 'member_id' => $member->id, 'user_id' => $member->user_id, 'role_in_event' => EventRole::Anggota->value]);
            }
        }

        return $events;
    }

    /** @param array<string, Event> $events */
    private function eventActivity(Carbon $start, Carbon $end, array $events): void
    {
        $ym = $start->format('Y-m');
        $service = app(EventExpenseService::class);

        $incomes = [
            'natal' => ['2025-12' => [[16, 'Iuran Kegiatan', 6_500_000], [21, 'Persembahan Natal', 24_000_000]]],
            'paskah' => ['2026-04' => [[3, 'Iuran Kegiatan', 5_200_000], [5, 'Persembahan Paskah', 9_800_000]]],
            'retreat' => ['2026-05' => [[10, 'Iuran Kegiatan', 21_000_000]], '2026-06' => [[3, 'Iuran Kegiatan', 19_500_000]]],
            'bazaar' => ['2026-10' => [[11, 'Iuran Kegiatan', 3_400_000]]],
        ];
        foreach ($events as $key => $event) {
            foreach ($incomes[$key][$ym] ?? [] as [$day, $category, $amount]) {
                $date = $start->copy()->day($day);
                if ($date->lessThanOrEqualTo($end)) {
                    $this->eventIncome($event, $date, $category, $amount);
                }
            }
        }
        if (Carbon::parse('2026-01-01')->lessThanOrEqualTo($start)) {
            $date = $start->copy()->day(5);
            if ($date->lessThanOrEqualTo($end)) {
                $this->eventIncome($events['aula'], $date, 'Persembahan Khusus Pembangunan Aula', $this->rand(14_000_000, 30_000_000, 50_000));
            }
        }

        $expenses = [
            'natal' => ['2025-12' => [[17, 'Dekorasi Natal Indah', 'Dekorasi pohon dan panggung Natal', 6_800_000], [19, 'CV Konsumsi Nusantara', 'Konsumsi latihan dan pentas', 4_200_000], [22, 'Toko Mainan Ceria', 'Bingkisan Natal untuk 120 anak', 7_300_000], [23, 'Sound System Mandiri', 'Sewa sound system dan lighting', 5_400_000]]],
            'paskah' => ['2026-04' => [[2, 'Toko Bunga Segar', 'Rangkaian bunga altar Paskah', 2_600_000], [4, 'Katering Berkat', 'Sarapan bersama kebaktian subuh Paskah', 3_900_000]]],
            'retreat' => ['2026-05' => [[18, 'Villa Puncak Asri', 'Uang muka penginapan retreat', 12_000_000]], '2026-06' => [[10, 'PO Bus Pariwisata', 'Sewa bus pulang-pergi', 9_500_000], [12, 'Katering Berkat', 'Konsumsi tiga hari', 11_800_000], [13, 'Pdt. Samuel Wijaya', 'Honor pembicara retreat', 3_000_000]]],
            'aula' => ['2026-02' => [[16, 'PT Cipta Karya Bangunan', 'Termin 1 pondasi aula', 28_000_000]], '2026-04' => [[18, 'PT Cipta Karya Bangunan', 'Termin 2 struktur dan dinding aula', 32_000_000]], '2026-07' => [[15, 'PT Cipta Karya Bangunan', 'Termin 3 atap baja ringan aula', 30_000_000]], '2026-09' => [[16, 'Toko Bahan Bangunan Sejahtera', 'Material finishing dan keramik', 18_500_000]]],
            'bazaar' => ['2026-10' => [[14, 'Pasar Grosir Tanah Abang', 'Bahan dagangan bazaar', 2_800_000]]],
            'baksos' => ['2026-10' => [[16, 'Toko Sembako Murah', 'Paket sembako untuk 150 keluarga', 8_250_000]]],
        ];
        foreach ($events as $key => $event) {
            foreach ($expenses[$key][$ym] ?? [] as [$day, $payee, $desc, $amount]) {
                $date = $start->copy()->day($day);
                if ($date->greaterThan($end) || $event->fresh()->isClosed()) {
                    continue;
                }
                $category = $key === 'aula' ? 'Pembangunan & Renovasi' : ($this->chance(50) ? 'Perlengkapan Ibadah' : 'Konsumsi & Perjamuan');
                $threshold = (int) ChurchSetting::current()->expense_approval_threshold;
                $affordable = LedgerEntry::getBalance($event->fund_id) >= $amount;
                $pendingNow = $date->greaterThan($this->today->copy()->subDays(8));
                if (! $affordable && ! $pendingNow) {
                    $this->skipped++;

                    continue;
                }
                $submitter = $this->users[$this->pick(['panitia', 'panitia2', 'bendahara'])];
                $this->at($date, 10);
                $this->as($submitter);
                try {
                    $expense = $service->submitExpense($event, ['payee' => $payee, 'amount' => $amount, 'date' => $date->toDateString(), 'account_id' => $this->accounts[in_array($key, ['natal', 'paskah'], true) ? 'KAS' : 'BCA']->id, 'category_id' => $this->outCats[$category]->id, 'description' => $desc], $submitter, 'expenses/nota-demo.pdf');
                    if ($pendingNow) {
                        continue;
                    }
                    $approver = $amount > $threshold ? $this->users['majelis'] : $this->users['majelis2'];
                    $this->at($date->copy()->addDay(), 9);
                    $this->as($approver);
                    app(ExpenseService::class)->approve($expense, $approver);
                    $this->at($date->copy()->addDays(2), 10);
                    $this->as($this->users['bendahara']);
                    app(ExpenseService::class)->pay($expense, $this->users['bendahara']);
                } catch (Throwable $e) {
                    $this->skipped++;
                }
            }
        }

        foreach ($events as $key => $event) {
            $target = $this->eventTarget[$key];
            $startDate = Carbon::parse($event->start_date);
            if ($startDate->lessThanOrEqualTo($end) && $event->status->value === 'planning' && $startDate->lessThanOrEqualTo($this->today)) {
                $this->at($startDate, 8);
                $event->update(['status' => 'active']);
            }
            if ($target === 'completed' && Carbon::parse($event->end_date)->lessThan($end) && $event->fresh()->status->value === 'active') {
                $this->at(Carbon::parse($event->end_date)->addDay(), 9);
                $event->update(['status' => 'completed']);
            }
            if (in_array($key, ['natal', 'paskah'], true) && Carbon::parse($event->end_date)->addDays(20)->lessThanOrEqualTo($end) && ! $event->fresh()->isClosed()) {
                $this->at(Carbon::parse($event->end_date)->addDays(20), 10);
                $this->as($this->users['bendahara']);
                app(EventClosingService::class)->close($event->fresh(), $this->funds['UMUM']->id, 'Sisa dana dikembalikan ke kas umum setelah laporan panitia diterima.');
            }
        }
        if (! $events['baksos']->fresh()->isClosed() && $this->today->greaterThanOrEqualTo(Carbon::parse('2026-10-10')) && $events['baksos']->fresh()->status->value === 'planning') {
            $events['baksos']->update(['status' => 'active']);
        }
    }

    private function eventIncome(Event $event, Carbon $date, string $category, int $amount): void
    {
        $witness = $this->shuffle(['penghitung', 'penghitung2', 'penghitung3']);
        $this->at($date, 12, 30);
        $this->as($this->users[$witness[0]]);

        $calc = app(CountCalculationService::class)->calculate([$this->cashLine($category, $amount, 'amplop')]);
        $sheet = CountSheet::create([
            'type' => CountSheetType::Event, 'event_id' => $event->id, 'account_id' => $this->accounts['KAS']->id, 'date' => $date->toDateString(),
            'status' => CountSheetStatus::Draft, 'total_amount' => $calc['total_amount'], 'created_by' => $this->users[$witness[0]]->id, 'notes' => 'Penerimaan acara '.$event->name,
        ]);
        foreach ($calc['lines'] as $line) {
            CountLine::create(['count_sheet_id' => $sheet->id, 'category_id' => $line['category_id'], 'is_cash' => $line['is_cash'], 'denomination_counts' => $line['denomination_counts'], 'amount' => $line['amount']]);
        }
        $this->progressSheet($sheet, null, $date, 'locked', $witness);
    }

    // ------------------------------------------------------------------ minggu ini

    private function currentWeekLeftovers(): void
    {
        $date = $this->today->copy();
        $this->at($date, 7, 30);
        $this->as($this->users['penghitung']);
        ServiceSession::create(['service_schedule_id' => $this->schedules['Ibadah Doa Rabu']->id, 'date' => $date->toDateString(), 'name' => 'Ibadah Doa Rabu - '.$date->translatedFormat('j M Y'), 'is_completed' => false]);

        // Beberapa pengajuan menunggu keputusan supaya alur persetujuan terlihat.
        $this->expense($date->copy()->subDays(2), 'Toko Bahan Bangunan Sejahtera', 'Cat tembok dan perlengkapan renovasi ruang sekolah minggu', 6_750_000, 'Pemeliharaan Gedung', null, 'BCA', 'bendahara', null, null, 'pending');
        $this->expense($date->copy()->subDays(1), 'Komisi Anak', 'Dana kegiatan Natal anak', 2_150_000, 'Kegiatan Komisi', 'KOMS', 'BCA', 'penghitung2', null, null, 'pending');
        $this->expense($date->copy()->subDays(3), 'Toko Buku Kasih', 'Cetak buku liturgi Natal', 1_450_000, 'Operasional', null, 'KK', 'penghitung', null, null, 'approved');
    }

    // ------------------------------------------------------------------ laporan & penutupan

    private function reports(): void
    {
        $service = app(ReportFreezeService::class);
        $bendahara = $this->users['bendahara'];

        foreach ([['2026-07', 'Juli', 'approved'], ['2026-08', 'Agustus', 'approved'], ['2026-09', 'September', 'partial']] as [$ym, $label, $state]) {
            $start = Carbon::parse($ym.'-01');
            $end = $start->copy()->endOfMonth();
            $this->at($end->copy()->addDays(2), 9);
            $this->as($bendahara);
            $report = $service->initiate(['title' => "Laporan Keuangan Bulan {$label} 2026", 'period_type' => 'bulanan', 'start_date' => $start->toDateString(), 'end_date' => $end->toDateString()], $bendahara);

            $approvals = $report->approvals()->orderBy('order')->get();
            $limit = $state === 'approved' ? $approvals->count() : 1;
            foreach ($approvals->take($limit) as $i => $approval) {
                /** @var ReportApproval $approval */
                $user = User::findOrFail($approval->user_id);
                $this->at($end->copy()->addDays(3 + $i), 10);
                $this->as($user);
                $service->approve($report->fresh(), $approval, $user, $i === 0 ? null : 'Laporan telah diperiksa dan sesuai.');
            }
        }
    }

    private function closeOldPeriods(): void
    {
        $service = app(AccountingPeriodService::class);
        $cutoff = $this->today->copy()->subMonths(2)->endOfMonth()->toDateString();

        foreach (AccountingPeriod::where('end_date', '<=', $cutoff)->orderBy('start_date')->get() as $period) {
            $this->at(Carbon::parse($period->end_date)->addDays(5), 16);
            $service->close($period, $this->users['bendahara']);
        }
    }
}
