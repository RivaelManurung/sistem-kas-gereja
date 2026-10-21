<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('direction');
            $table->foreignId('default_fund_id')->constrained('funds')->restrictOnDelete();
            $table->boolean('allows_named')->default(false);
            $table->boolean('is_public')->default(true);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['name', 'direction']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
