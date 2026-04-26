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
        Schema::create('tasks', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('license_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('phone');
            $table->string('email');
            $table->string('password');
            $table->string("peoples")->default(1);
            $table->enum('priority',['low','medium','high'])->default('medium');
            $table->string('status')->nullable()->default('active');
            $table->string('result')->nullable()->default('waiting');
            $table->string('paylink')->nullable()->default(null);
            $table->string('proxy_ip')->nullable()->default(null);
            $table->string('proxy_port')->nullable()->default(null);
            $table->string('proxy_username')->nullable()->default(null);
            $table->string('proxy_password')->nullable()->default(null);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
