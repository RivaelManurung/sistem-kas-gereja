<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Data jemaat yang lengkap: keluarga, identitas, keanggotaan, sakramen/peristiwa gerejawi,
 * pelayanan, dan dokumen. Pilihan isian (status, wilayah, jabatan, jenis dokumen, dst.) disimpan
 * di lookup_options supaya bisa diatur dari Pengaturan, bukan di kode.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('households', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('family_number', 30)->nullable()->unique();
            $table->string('address', 500)->nullable();
            $table->string('rt_rw', 15)->nullable();
            $table->string('kelurahan', 100)->nullable();
            $table->string('kecamatan', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('postal_code', 10)->nullable();
            $table->string('housing_status', 40)->nullable();
            $table->string('phone', 50)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('members', function (Blueprint $table) {
            $table->string('nik', 16)->nullable()->unique()->after('member_number');
            $table->string('place_of_birth', 100)->nullable()->after('gender');
            $table->string('marital_status', 40)->nullable()->after('birth_date');
            $table->string('education', 40)->nullable()->after('marital_status');
            $table->string('occupation', 100)->nullable()->after('education');
            $table->string('father_name')->nullable()->after('occupation');
            $table->string('mother_name')->nullable()->after('father_name');
            $table->text('ktp_address')->nullable()->after('address');
            $table->foreignId('household_id')->nullable()->after('user_id')->constrained('households')->nullOnDelete();
            $table->string('family_role', 40)->nullable()->after('household_id');
            $table->string('membership_status', 40)->default('tetap')->after('family_role');
            $table->date('membership_date')->nullable()->after('membership_status');
            $table->string('previous_church')->nullable()->after('membership_date');
            $table->string('wilayah', 60)->nullable()->after('previous_church');
            $table->string('photo_path')->nullable()->after('wilayah');
            $table->string('emergency_name')->nullable()->after('photo_path');
            $table->string('emergency_phone', 50)->nullable()->after('emergency_name');
            $table->string('emergency_relation', 60)->nullable()->after('emergency_phone');
            $table->text('notes')->nullable()->after('emergency_relation');

            $table->index('wilayah');
            $table->index('membership_status');
        });

        Schema::create('member_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->date('date');
            $table->string('church')->nullable();
            $table->string('minister')->nullable();
            $table->string('certificate_number', 80)->nullable();
            $table->string('civil_number', 80)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['member_id', 'type']);
        });

        Schema::create('member_ministries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->string('ministry', 60);
            $table->string('role_title', 100)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['member_id', 'ministry']);
        });

        Schema::create('member_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->string('title')->nullable();
            $table->string('document_number', 80)->nullable();
            $table->date('issued_date')->nullable();
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime', 100);
            $table->unsignedInteger('size');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['member_id', 'type']);
        });

        $now = now();
        $rows = [];
        $add = function (string $group, array $options, bool $system = true) use (&$rows, $now) {
            $order = 1;
            foreach ($options as $value => $label) {
                $rows[] = ['group' => $group, 'value' => $value, 'label' => $label, 'sort_order' => $order++, 'is_active' => true, 'is_system' => $system, 'created_at' => $now, 'updated_at' => $now];
            }
        };

        $add('marital_status', ['belum_menikah' => 'Belum menikah', 'menikah' => 'Menikah', 'cerai_hidup' => 'Cerai hidup', 'cerai_mati' => 'Cerai mati (janda/duda)']);
        $add('education', ['belum_sekolah' => 'Belum sekolah', 'sd' => 'SD', 'smp' => 'SMP', 'sma' => 'SMA/SMK', 'diploma' => 'Diploma (D1-D3)', 's1' => 'Sarjana (S1/D4)', 's2' => 'Magister (S2)', 's3' => 'Doktor (S3)']);
        $add('family_role', ['kepala_keluarga' => 'Kepala keluarga', 'pasangan' => 'Suami/istri', 'anak' => 'Anak', 'menantu' => 'Menantu', 'cucu' => 'Cucu', 'orang_tua' => 'Orang tua', 'saudara' => 'Saudara', 'lainnya' => 'Lainnya']);
        $add('housing_status', ['milik_sendiri' => 'Milik sendiri', 'kontrak' => 'Kontrak/sewa', 'keluarga' => 'Ikut keluarga', 'dinas' => 'Rumah dinas', 'kost' => 'Kost']);
        $add('membership_status', ['tetap' => 'Anggota tetap (sudah sidi)', 'anak' => 'Anggota anak (belum sidi)', 'simpatisan' => 'Simpatisan', 'tamu' => 'Tamu terdaftar', 'pindah' => 'Pindah (atestasi keluar)', 'meninggal' => 'Meninggal']);
        $add('wilayah', ['wilayah_1' => 'Wilayah 1', 'wilayah_2' => 'Wilayah 2', 'wilayah_3' => 'Wilayah 3', 'wilayah_4' => 'Wilayah 4', 'wilayah_5' => 'Wilayah 5'], false);
        $add('ministry', [
            'majelis' => 'Majelis (Penatua)', 'diaken' => 'Diaken', 'pendeta' => 'Pendeta/Penginjil', 'komisi_anak' => 'Komisi Anak (Sekolah Minggu)',
            'komisi_remaja' => 'Komisi Remaja', 'komisi_pemuda' => 'Komisi Pemuda', 'komisi_wanita' => 'Persekutuan Wanita', 'komisi_pria' => 'Persekutuan Pria',
            'komisi_lansia' => 'Komisi Lansia', 'paduan_suara' => 'Paduan Suara', 'musik' => 'Tim Musik', 'multimedia' => 'Multimedia', 'penyambut' => 'Penyambut Jemaat', 'diakonia' => 'Tim Diakonia',
        ], false);
        $add('member_document_type', ['ktp' => 'KTP', 'kk' => 'Kartu Keluarga', 'akta_lahir' => 'Akta kelahiran', 'surat_baptis' => 'Surat baptis', 'surat_sidi' => 'Surat sidi', 'akta_nikah' => 'Akta/surat nikah', 'atestasi' => 'Surat atestasi/pindah', 'foto' => 'Pas foto', 'lainnya' => 'Dokumen lain']);
        $add('milestone_type', ['baptis_anak' => 'Baptis anak', 'baptis_dewasa' => 'Baptis dewasa', 'sidi' => 'Sidi (pengakuan percaya)', 'pemberkatan_nikah' => 'Pemberkatan nikah', 'atestasi_masuk' => 'Atestasi masuk', 'atestasi_keluar' => 'Atestasi keluar']);

        DB::table('lookup_options')->insert($rows);
    }

    public function down(): void
    {
        DB::table('lookup_options')->whereIn('group', ['marital_status', 'education', 'family_role', 'housing_status', 'membership_status', 'wilayah', 'ministry', 'member_document_type', 'milestone_type'])->delete();

        Schema::dropIfExists('member_documents');
        Schema::dropIfExists('member_ministries');
        Schema::dropIfExists('member_milestones');

        Schema::table('members', function (Blueprint $table) {
            $table->dropConstrainedForeignId('household_id');
            $table->dropIndex(['wilayah']);
            $table->dropIndex(['membership_status']);
            $table->dropColumn(['nik', 'place_of_birth', 'marital_status', 'education', 'occupation', 'father_name', 'mother_name', 'ktp_address', 'family_role', 'membership_status', 'membership_date', 'previous_church', 'wilayah', 'photo_path', 'emergency_name', 'emergency_phone', 'emergency_relation', 'notes']);
        });

        Schema::dropIfExists('households');
    }
};
