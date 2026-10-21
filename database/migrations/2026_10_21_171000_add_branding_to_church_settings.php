<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('church_settings', function (Blueprint $table) {
            $table->string('system_name', 60)->nullable()->after('name');
            $table->string('favicon_path')->nullable()->after('logo_path');
        });
    }

    public function down(): void
    {
        Schema::table('church_settings', function (Blueprint $table) {
            $table->dropColumn(['system_name', 'favicon_path']);
        });
    }
};
