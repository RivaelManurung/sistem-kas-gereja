<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // No FK: the trail must outlive the user it names.
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id');
            $table->string('event');
            $table->jsonb('old_values')->default('{}');
            $table->jsonb('new_values')->default('{}');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['auditable_type', 'auditable_id']);
        });

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION audit_logs_block_mutation() RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'audit_logs is append-only';
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS audit_logs_append_only ON audit_logs;
            CREATE TRIGGER audit_logs_append_only
                BEFORE UPDATE OR DELETE ON audit_logs
                FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        DB::unprepared('DROP FUNCTION IF EXISTS audit_logs_block_mutation()');
    }
};
