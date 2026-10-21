<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('frozen_report_id')->constrained('frozen_reports')->cascadeOnDelete();
            $table->foreignId('report_signatory_id')->nullable()->constrained('report_signatories')->nullOnDelete();
            $table->string('signatory_title');
            $table->string('signatory_position');
            $table->string('role')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('order')->default(1);
            $table->string('status')->default('pending')->index(); // pending, approved, rejected
            $table->string('signature_path')->nullable();
            $table->string('signer_name')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['frozen_report_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_approvals');
    }
};
