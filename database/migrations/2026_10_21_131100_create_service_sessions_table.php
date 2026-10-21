<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_schedule_id')->nullable()->constrained('service_schedules')->nullOnDelete();
            $table->date('date')->index();
            $table->string('name');
            $table->text('notes')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });

        DB::statement('CREATE UNIQUE INDEX service_sessions_schedule_date_unique ON service_sessions (service_schedule_id, date) WHERE service_schedule_id IS NOT NULL;');
    }

    public function down(): void
    {
        Schema::dropIfExists('service_sessions');
    }
};
