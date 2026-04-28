<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);


// CRUD Donasi Donatur
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/donations', [DonationController::class, 'index']);
    Route::get('/donations/{id}', [DonationController::class, 'show'])->whereNumber('id');
    Route::post('/donations', [DonationController::class, 'store']);
    Route::put('/donations/{id}', [DonationController::class, 'update'])->whereNumber('id');
    Route::delete('/donations/{id}', [DonationController::class, 'destroy'])->whereNumber('id');
    Route::get('/profile', [ProfileController::class, 'index']);
    Route::post('/profile', [ProfileController::class, 'store']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    Route::post('/logout', [LoginController::class, 'logout']);
    Route::post('/donations/{id}/claim', [DonationController::class, 'claim'])->whereNumber('id');
});

Route::prefix('admin')->middleware(['auth:web', 'admin'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    Route::get('/moderation/queue', [ModerationController::class, 'queue']);
    Route::patch('/moderation/{donation}/approve', [ModerationController::class, 'approve']);
    Route::patch('/moderation/{donation}/reject', [ModerationController::class, 'reject']);

    Route::get('/users', [UserManagementController::class, 'index']);
    Route::patch('/users/{user}', [UserManagementController::class, 'update']);

    Route::get('/reports/export/csv', [ReportController::class, 'exportCsv']);
});
