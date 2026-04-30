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
        Schema::table('users', function (Blueprint $table) {
            // Receiver/Penerima specific fields
            $table->text('address')->nullable()->after('company_address');
            $table->string('neighborhood')->nullable()->after('address');
            $table->string('district')->nullable()->after('neighborhood');
            $table->string('postal_code')->nullable()->after('district');
            $table->enum('need_category', ['food', 'clothing', 'household', 'health', 'education', 'other'])->nullable()->after('postal_code');
            $table->text('need_description')->nullable()->after('need_category');
            $table->boolean('is_verified_receiver')->default(false)->after('need_description');
            $table->timestamp('verification_date')->nullable()->after('is_verified_receiver');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['address', 'neighborhood', 'district', 'postal_code', 'need_category', 'need_description', 'is_verified_receiver', 'verification_date']);
        });
    }
};
