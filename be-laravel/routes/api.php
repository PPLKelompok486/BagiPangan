<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('receiver')->group(function () {
        Route::get('/donations', [DonationController::class, 'index']);
        Route::get('/donations/mine', [DonationController::class, 'myClaims']);
        Route::get('/donations/{donation}', [DonationController::class, 'show']);
        Route::post('/donations/{donation}/claim', [DonationController::class, 'claim']);
    });
});
