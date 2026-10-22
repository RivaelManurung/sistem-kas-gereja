<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wilayah (pembagian jemaat per wilayah) menjadi data tersendiri lengkap dengan pengurusnya
 * (penatua/sintua, diaken, ketua, dst.). Keluarga yang menentukan wilayah; jemaat mengikuti keluarganya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wilayahs', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60)->unique();
            $table->string('code', 10)->nullable()->unique();
            $table->text('description')->nullable();
            $table->text('coverage')->nullable();
            $table->string('meeting_info', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('wilayah_officers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wilayah_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->string('role', 60);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['wilayah_id', 'role']);
            $table->index('member_id');
        });

        Schema::table('households', function (Blueprint $table) {
            $table->foreignId('wilayah_id')->nullable()->after('housing_status')->constrained('wilayahs')->nullOnDelete();
        });

        // Pindahkan nilai wilayah lama (kolom string di jemaat) ke tabel baru.
        $labels = DB::table('lookup_options')->where('group', 'wilayah')->pluck('label', 'value');
        $now = now();
        foreach (DB::table('members')->whereNotNull('wilayah')->distinct()->pluck('wilayah') as $value) {
            $id = DB::table('wilayahs')->insertGetId(['name' => $labels[$value] ?? $value, 'created_at' => $now, 'updated_at' => $now]);
            $householdIds = DB::table('members')->where('wilayah', $value)->whereNotNull('household_id')->distinct()->pluck('household_id');
            DB::table('households')->whereIn('id', $householdIds)->update(['wilayah_id' => $id]);
        }

        Schema::table('members', function (Blueprint $table) {
            $table->dropIndex(['wilayah']);
            $table->dropColumn('wilayah');
        });

        DB::table('lookup_options')->where('group', 'wilayah')->delete();

        $order = 1;
        foreach (['penatua' => 'Penatua (Sintua)', 'diaken' => 'Diaken', 'ketua' => 'Ketua wilayah', 'sekretaris' => 'Sekretaris wilayah', 'bendahara' => 'Bendahara wilayah', 'koordinator' => 'Koordinator kelompok'] as $value => $label) {
            DB::table('lookup_options')->insert(['group' => 'wilayah_role', 'value' => $value, 'label' => $label, 'sort_order' => $order++, 'is_active' => true, 'is_system' => $value === 'penatua', 'created_at' => $now, 'updated_at' => $now]);
        }
    }

    public function down(): void
    {
        DB::table('lookup_options')->where('group', 'wilayah_role')->delete();

        Schema::table('members', function (Blueprint $table) {
            $table->string('wilayah', 60)->nullable()->after('previous_church');
            $table->index('wilayah');
        });

        Schema::table('households', function (Blueprint $table) {
            $table->dropConstrainedForeignId('wilayah_id');
        });

        Schema::dropIfExists('wilayah_officers');
        Schema::dropIfExists('wilayahs');
    }
};
