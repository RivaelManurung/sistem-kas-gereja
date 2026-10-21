<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attribute_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type');
            $table->string('key', 50);
            $table->string('label');
            $table->string('data_type');
            $table->jsonb('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_public')->default(true);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->unsignedBigInteger('scope_event_id')->nullable();
            $table->timestamps();
        });

        // PostgreSQL 15+ NULLS NOT DISTINCT treat NULL scope_event_id as equal
        DB::statement('CREATE UNIQUE INDEX attribute_definitions_entity_key_scope_unique ON attribute_definitions (entity_type, key, scope_event_id) NULLS NOT DISTINCT;');
    }

    public function down(): void
    {
        Schema::dropIfExists('attribute_definitions');
    }
};
