<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lookup_options', function (Blueprint $table) {
            $table->id();
            $table->string('group', 40);
            $table->string('value', 60);
            $table->string('label', 80);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false);
            $table->timestamps();

            $table->unique(['group', 'value']);
            $table->index(['group', 'is_active', 'sort_order']);
        });

        $now = now();
        DB::table('lookup_options')->insert([
            ['group' => 'payment_method', 'value' => 'cash', 'label' => 'Tunai (Amplop)', 'sort_order' => 1, 'is_active' => true, 'is_system' => true, 'created_at' => $now, 'updated_at' => $now],
            ['group' => 'payment_method', 'value' => 'transfer', 'label' => 'Transfer Rekening', 'sort_order' => 2, 'is_active' => true, 'is_system' => true, 'created_at' => $now, 'updated_at' => $now],
            ['group' => 'payment_method', 'value' => 'qris', 'label' => 'QRIS Gereja', 'sort_order' => 3, 'is_active' => true, 'is_system' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('lookup_options');
    }
};
