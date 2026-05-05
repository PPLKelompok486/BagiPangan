<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);

    Route::get('/donations', [DonationController::class, 'index']);
    Route::get('/donations/categories', [DonationController::class, 'categories']);
    Route::get('/donations/{id}', [DonationController::class, 'show'])->whereNumber('id');

Route::middleware('token.auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'index']);
    Route::post('/profile', [ProfileController::class, 'store']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    Route::post('/logout', [LoginController::class, 'logout']);
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/donations/map', [MapController::class, 'index']);
        Route::get('/donations/{id}/map-detail', [MapController::class, 'detail'])->whereNumber('id');
    });
    Route::get('/donations/mine', [DonationController::class, 'mine']);
    Route::post('/donations', [DonationController::class, 'store']);
    Route::put('/donations/{id}', [DonationController::class, 'update']);
    Route::delete('/donations/{id}', [DonationController::class, 'cancel']);
    Route::post('/donations/{id}/claim', [DonationController::class, 'claim'])->whereNumber('id');
    Route::get('/claims/mine', [ClaimController::class, 'mine']);
    Route::post('/claims/{claim}/proof', [ClaimController::class, 'uploadProof'])->whereNumber('claim');
    Route::post('/claims/{claim}/cancel', [ClaimController::class, 'cancel'])->whereNumber('claim');

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });
});

Route::prefix('admin')->middleware(['web', 'auth:web', 'admin'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    Route::get('/moderation/queue', [ModerationController::class, 'queue']);
    Route::patch('/moderation/{donation}/approve', [ModerationController::class, 'approve']);
    Route::patch('/moderation/{donation}/reject', [ModerationController::class, 'reject']);

    Route::get('/users', [UserManagementController::class, 'index']);
    Route::patch('/users/{user}', [UserManagementController::class, 'update']);

    Route::get('/reports/export/csv', [ReportController::class, 'exportCsv']);
});

Route::middleware('token.auth')->group(function () {
    Route::apiResource('fund-donations', \App\Http\Controllers\Api\FundDonationController::class);
    Route::post('fund-donations/{fund_donation}/cancel', [\App\Http\Controllers\Api\FundDonationController::class, 'cancel']);
});

Route::prefix('admin')->middleware(['token.auth', 'admin'])->group(function () {
    Route::get('/fund-donations/monitoring', [\App\Http\Controllers\Api\FundDonationController::class, 'index']);
});
