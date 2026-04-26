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
        Schema::create('proxies', function (Blueprint $table) {
            $table->ulid('id')->primary();           
            $table->foreignUlid('license_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type')->default('http');
            $table->string('ip');
            $table->integer('port');
            $table->string('username')->nullable();
            $table->string('password')->nullable();  
            $table->softDeletes();         
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proxies');
    }
};
