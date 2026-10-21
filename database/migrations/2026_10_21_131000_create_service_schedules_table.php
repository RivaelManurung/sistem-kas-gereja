<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('day_of_week'); // 0 = Minggu, 6 = Sabtu
            $table->string('time', 10);
            $table->jsonb('default_category_ids')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_schedules');
    }
};
