<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('frozen_reports', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('period_type'); // harian, mingguan, bulanan, triwulan, semester, tahunan, custom
            $table->date('start_date')->index();
            $table->date('end_date')->index();
            $table->string('status')->default('draft')->index(); // draft, pending_approval, approved, rejected
            $table->jsonb('data_snapshot');
            $table->string('pdf_path')->nullable();
            $table->string('sha256_hash', 64)->nullable()->index();
            $table->string('verification_code', 64)->unique();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('frozen_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('frozen_reports');
    }
};
