<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allocation_rule_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('allocation_rule_id')->constrained('allocation_rules')->cascadeOnDelete();
            $table->foreignId('fund_id')->constrained('funds')->restrictOnDelete();
            $table->decimal('percentage', 5, 2);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('allocation_rule_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocation_rule_items');
    }
};
