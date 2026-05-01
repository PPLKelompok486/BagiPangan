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
        Schema::create('fund_donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('donor_name');
            $table->decimal('amount', 15, 2);
            $table->date('donation_date');
            $table->string('payment_method');
            $table->enum('payment_status', ['pending', 'success', 'failed', 'cancelled'])->default('pending');
            $table->string('snap_token')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('additional_details')->nullable();
            $table->timestamps();

            $table->index(['payment_status', 'donation_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fund_donations');
    }
};
