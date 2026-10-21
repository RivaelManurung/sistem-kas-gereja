<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('church_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Gereja');
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('timezone')->default('Asia/Jakarta');
            $table->string('logo_path')->nullable();
            $table->string('stamp_path')->nullable();
            $table->jsonb('denominations')->default(json_encode([100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100]));
            $table->unsignedSmallInteger('min_confirmations_service')->default(2);
            $table->unsignedSmallInteger('min_confirmations_event')->default(2);
            $table->unsignedSmallInteger('min_confirmations_general')->default(2);
            $table->unsignedBigInteger('expense_approval_threshold')->default(0);
            $table->boolean('allow_negative_balance')->default(false);
            $table->boolean('public_page_enabled')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('church_settings');
    }
};
