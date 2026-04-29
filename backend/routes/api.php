<?php

use App\Http\Controllers\Auth\LicenseAuthController;
use App\Http\Controllers\Auth\UserAuthController;
use App\Http\Controllers\CaptchaController;
use App\Http\Controllers\LicenseController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\ProxyController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Public Auth Routes ---
Route::post('/login', [UserAuthController::class, 'login']);
Route::post('/license/login', [LicenseAuthController::class, 'login']);

Route::get('/get-otp/{phone}', [OtpController::class, 'getOtpByPhone']);
Route::post('/insert-otp', [OtpController::class, 'insertotp']);
Route::get('/clear-otp/{mobile}', [OtpController::class, 'clear_otp']);
Route::post('/update_device', [TaskController::class, 'update_device_status']);



// --- Public Open API ---
Route::get('/open/tasks', [TaskController::class, 'get_all_tasks']); 
Route::post('/open/update_paylink', [TaskController::class, 'update_paylink']);
Route::post('/open/update_result', [TaskController::class, 'update_result']);
Route::post('/open/update_bot_details', [TaskController::class, 'update_bot_details']);



// --- Authenticated Routes ---
Route::middleware('auth:sanctum')->group(function () {    
    // Auth User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/license/validate', [LicenseAuthController::class, 'validate']);
    Route::post('/logout', [UserAuthController::class, 'logout']);
    Route::post('/license/logout', [LicenseAuthController::class, 'logout']);
    // --- Task Management (Common for Users & Licenses) ---
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::post('/tasks/{task}', [TaskController::class, 'update']);
    Route::post('/tasks/{task}/priority', [TaskController::class, 'updatePriority']);
    Route::post('/tasks/{task_id}/delete', [TaskController::class, 'destroy']);
    Route::apiResource('proxies', ProxyController::class);
    Route::apiResource('captchas', CaptchaController::class);
    // --- Admin Management Routes ---
    Route::middleware('admin')->group(function () {
        Route::apiResource('licenses', LicenseController::class);
        Route::apiResource('users', UserController::class);
       
    });
});




/*Tasks*/

