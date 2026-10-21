<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('count_confirmations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('count_sheet_id')->constrained('count_sheets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('confirmed_at')->useCurrent();

            $table->unique(['count_sheet_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('count_confirmations');
    }
};
