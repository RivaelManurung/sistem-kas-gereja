<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('count_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('count_sheet_id')->constrained('count_sheets')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->boolean('is_cash')->default(true);
            $table->jsonb('denomination_counts')->nullable();
            $table->bigInteger('amount')->default(0);
            $table->string('reference_number')->nullable();
            $table->string('proof_path')->nullable();
            $table->timestamps();

            $table->index(['count_sheet_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('count_lines');
    }
};
