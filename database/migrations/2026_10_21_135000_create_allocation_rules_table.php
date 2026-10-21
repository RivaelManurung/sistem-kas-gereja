<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allocation_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name');
            $table->date('valid_from');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['category_id', 'valid_from']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocation_rules');
    }
};
