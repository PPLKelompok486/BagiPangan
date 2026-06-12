<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PostgreSQL does not create indexes for foreign key columns automatically
 * (unlike MySQL), so every lookup on these columns was a sequential scan.
 * users.remember_token is hit by TokenAuth on every authenticated request.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('remember_token', 'idx_users_remember_token');
        });

        Schema::table('donations', function (Blueprint $table) {
            $table->index('user_id', 'idx_donations_user_id');
            $table->index('category_id', 'idx_donations_category_id');
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->index(['donation_id', 'status'], 'idx_claims_donation_id_status');
            $table->index('receiver_id', 'idx_claims_receiver_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_remember_token');
        });

        Schema::table('donations', function (Blueprint $table) {
            $table->dropIndex('idx_donations_user_id');
            $table->dropIndex('idx_donations_category_id');
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->dropIndex('idx_claims_donation_id_status');
            $table->dropIndex('idx_claims_receiver_id');
        });
    }
};
