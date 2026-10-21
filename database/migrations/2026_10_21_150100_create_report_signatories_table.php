<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_signatories', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // e.g. "Dibuat oleh", "Diperiksa oleh", "Disetujui oleh"
            $table->string('position'); // e.g. "Bendahara", "Ketua Majelis", "Pendeta"
            $table->string('role')->nullable(); // e.g. "bendahara", "majelis", "pemeriksa"
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_signatories');
    }
};
