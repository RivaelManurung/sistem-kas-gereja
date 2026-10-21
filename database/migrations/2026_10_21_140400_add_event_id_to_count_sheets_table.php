<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('count_sheets', function (Blueprint $table) {
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->index('event_id');
        });
    }

    public function down(): void
    {
        Schema::table('count_sheets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('event_id');
        });
    }
};
