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

            //those columns will be updated or created by user only
            $table->foreignUlid('license_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('phone')->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            /////             

            //this columns will be updated by bot using api when bot uploads pdfs files
            $table->integer("peoples")->default(1);
            $table->string("ivacCenter")->nullable()->default(null);
            $table->string("mission")->nullable()->default(null);
            $table->string("visatype")->nullable()->default(null);   
            /////



            //storing uploaded pdf files paths as JSON array
            $table->json('files')->nullable()->default(null);


            //those columns will be updated by bot using api only
            
            $table->enum('status', ['active', 'inactive', 'pending','success','error','complete'])->default('active');//bot will update it when it processes the task
            $table->string('result')->nullable()->default(null);//it will contain any error messages like credential error or others  , bot will update it on error       
            $table->string('paylink')->nullable()->default(null);//when bot successfull hit payment this will be updated         
            $table->timestamp('success_at')->nullable()->default(null); //when bot successfull hit payment this will be updated         
            
            
            
            $table->timestamp('device_last_seen')->nullable()->default(null); // mobile app will update this time periodically to inform that mobile app for otp forwarding is online
            
        



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
