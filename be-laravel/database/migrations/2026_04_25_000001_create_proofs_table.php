<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proofs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_id')->constrained('donations')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->string('image_path');
            $table->string('image_url');
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();

            $table->unique('donation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proofs');
    }
};
