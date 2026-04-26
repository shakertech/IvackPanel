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
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('proxies', ProxyController::class);
    Route::apiResource('captchas', CaptchaController::class);

    // --- Admin Management Routes ---
    Route::middleware('admin')->group(function () {
        Route::apiResource('licenses', LicenseController::class);
        Route::apiResource('users', UserController::class);
       
    });
});
