<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('count_sheets', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('service');
            $table->foreignId('service_session_id')->nullable()->constrained('service_sessions')->nullOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->restrictOnDelete();
            $table->date('date');
            $table->string('status')->default('draft');
            $table->bigInteger('total_amount')->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('idempotency_key')->nullable()->unique();
            $table->timestamps();

            $table->index(['date', 'status']);
            $table->index('service_session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('count_sheets');
    }
};
