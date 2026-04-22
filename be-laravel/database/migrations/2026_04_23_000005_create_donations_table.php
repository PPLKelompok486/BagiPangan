<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('donation_categories')->nullOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('location_city');
            $table->text('location_address')->nullable();
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->unsignedInteger('portion_count')->default(1);
            $table->enum('status', ['pending', 'approved', 'rejected', 'claimed', 'completed', 'cancelled'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('location_city');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};
