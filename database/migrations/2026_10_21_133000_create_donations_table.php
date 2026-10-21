<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('count_sheet_id')->nullable()->constrained('count_sheets')->nullOnDelete();
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->string('donor_name')->nullable();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->bigInteger('amount');
            $table->string('payment_method')->default('cash');
            $table->string('receipt_number')->unique();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['category_id', 'created_at']);
            $table->index('member_id');
            $table->index('count_sheet_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
