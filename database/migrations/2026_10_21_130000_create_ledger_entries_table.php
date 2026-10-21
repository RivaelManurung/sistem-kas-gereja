<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->date('entry_date')->index();
            $table->foreignId('account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignId('fund_id')->constrained('funds')->restrictOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->restrictOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('direction'); // 'in' or 'out'
            $table->text('description')->nullable();
            $table->nullableMorphs('source');
            $table->foreignId('reverses_id')->nullable()->constrained('ledger_entries')->nullOnDelete();
            $table->string('idempotency_key')->nullable()->unique();
            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['fund_id', 'entry_date']);
            $table->index(['account_id', 'entry_date']);
        });

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION ledger_entries_block_mutation() RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'ledger_entries is append-only';
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS ledger_entries_append_only ON ledger_entries;
            CREATE TRIGGER ledger_entries_append_only
                BEFORE UPDATE OR DELETE ON ledger_entries
                FOR EACH ROW EXECUTE FUNCTION ledger_entries_block_mutation();
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_entries');
        DB::unprepared('DROP FUNCTION IF EXISTS ledger_entries_block_mutation() CASCADE;');
    }
};
