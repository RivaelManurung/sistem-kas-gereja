<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bank_deposits', function (Blueprint $table) {
            $table->string('idempotency_key', 64)->nullable()->unique()->after('status');
        });

        Schema::table('fund_transfers', function (Blueprint $table) {
            $table->string('idempotency_key', 64)->nullable()->unique()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fund_transfers', function (Blueprint $table) {
            $table->dropColumn('idempotency_key');
        });

        Schema::table('bank_deposits', function (Blueprint $table) {
            $table->dropColumn('idempotency_key');
        });
    }
};
