<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('location_address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->text('address_detail')->nullable()->after('longitude');

            $table->index(['latitude', 'longitude'], 'idx_donations_lat_lng');
            $table->index('status', 'idx_donations_status');
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropIndex('idx_donations_lat_lng');
            $table->dropIndex('idx_donations_status');
            $table->dropColumn(['latitude', 'longitude', 'address_detail']);
        });
    }
};
