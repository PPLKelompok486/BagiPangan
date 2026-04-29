<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::prefix('admin')->middleware(['auth:web', 'admin'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    Route::get('/moderation/queue', [ModerationController::class, 'queue']);
    Route::patch('/moderation/{donation}/approve', [ModerationController::class, 'approve']);
    Route::patch('/moderation/{donation}/reject', [ModerationController::class, 'reject']);

    Route::get('/users', [UserManagementController::class, 'index']);
    Route::patch('/users/{user}', [UserManagementController::class, 'update']);

    Route::get('/reports/export/csv', [ReportController::class, 'exportCsv']);
});
