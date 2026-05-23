<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DonationManagementController;
use App\Http\Controllers\Admin\CategoryManagementController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\Admin\ExportReportController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::get('/donations', [DonationController::class, 'index']);
    Route::get('/donations/categories', [DonationController::class, 'categories']);
    Route::get('/donations/{id}', [DonationController::class, 'show'])->whereNumber('id');

    Route::middleware('throttle:60,1')->group(function () {
        Route::get('/donations/map', [MapController::class, 'index']);
        Route::get('/donations/{id}/map-detail', [MapController::class, 'detail'])->whereNumber('id');
    });

Route::middleware('token.auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'index']);
    Route::post('/profile', [ProfileController::class, 'store']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/donations/mine/export', [DonationController::class, 'exportMine']);
    Route::get('/donations/mine', [DonationController::class, 'mine']);
    Route::post('/donations', [DonationController::class, 'store']);
    Route::put('/donations/{id}', [DonationController::class, 'update']);
    Route::delete('/donations/{id}', [DonationController::class, 'cancel']);
    Route::post('/donations/{id}/claim', [DonationController::class, 'claim'])->whereNumber('id');
    Route::get('/claims/mine/export', [ClaimController::class, 'exportMine']);
    Route::get('/claims/mine', [ClaimController::class, 'mine']);
    Route::post('/claims/{claim}/proof', [ClaimController::class, 'uploadProof'])->whereNumber('claim');
    Route::post('/claims/{claim}/cancel', [ClaimController::class, 'cancel'])->whereNumber('claim');
});

Route::prefix('admin')->middleware(['web', 'auth:web', 'admin'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    Route::get('/moderation/queue', [ModerationController::class, 'queue']);
    Route::patch('/moderation/{donation}/approve', [ModerationController::class, 'approve']);
    Route::patch('/moderation/{donation}/reject', [ModerationController::class, 'reject']);

    Route::get('/categories', [CategoryManagementController::class, 'index']);
    Route::post('/categories', [CategoryManagementController::class, 'store']);
    Route::patch('/categories/{category}', [CategoryManagementController::class, 'update'])->whereNumber('category');
    Route::delete('/categories/{category}', [CategoryManagementController::class, 'destroy'])->whereNumber('category');

    Route::post('/donations', [DonationManagementController::class, 'store']);
    Route::get('/donations/{donation}', [DonationManagementController::class, 'show'])->whereNumber('donation');
    Route::patch('/donations/{donation}', [DonationManagementController::class, 'update'])->whereNumber('donation');
    Route::delete('/donations/{donation}', [DonationManagementController::class, 'destroy'])->whereNumber('donation');

    Route::get('/users', [UserManagementController::class, 'index']);
    Route::patch('/users/{user}', [UserManagementController::class, 'update']);
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // Filtered, validated, audit-logged donation export.
    // Bound to /reports/export to match the frontend admin reports page,
    // which sends date_from/date_to/status/donor_id query params.
    Route::get('/reports/export', [ExportReportController::class, 'export']);
});

Route::middleware('token.auth')->group(function () {
    Route::apiResource('fund-donations', \App\Http\Controllers\Api\FundDonationController::class);
    Route::post('fund-donations/{fund_donation}/cancel', [\App\Http\Controllers\Api\FundDonationController::class, 'cancel']);
});

Route::prefix('admin')->middleware(['token.auth', 'admin'])->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/fund-donations/monitoring', [\App\Http\Controllers\Api\FundDonationController::class, 'index']);
    Route::get('/reports/analytics', [ReportController::class, 'analytics']);
});
