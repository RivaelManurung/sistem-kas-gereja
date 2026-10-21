<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('scope_event_id')->nullable()->constrained('events')->cascadeOnDelete();
            $table->dropUnique(['name', 'direction']);
        });

        DB::statement('CREATE UNIQUE INDEX categories_name_direction_scope_unique ON categories (name, direction, scope_event_id) NULLS NOT DISTINCT;');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS categories_name_direction_scope_unique;');

        Schema::table('categories', function (Blueprint $table) {
            $table->dropConstrainedForeignId('scope_event_id');
            $table->unique(['name', 'direction']);
        });
    }
};
