<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('license_key')->unique();
            $table->string('machine')->nullable();
            $table->string('license_type')->default('trial'); // trial/paid
            $table->string('status')->default('active');
            $table->timestamp('expiry_date');            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};
