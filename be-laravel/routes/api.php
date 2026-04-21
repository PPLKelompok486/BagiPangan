<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DonationModerationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\Admin\UserManagementController;

Route::post('/register', [RegisterController::class, 'register']);

Route::prefix('admin')
	->middleware(['auth', 'admin'])
	->group(function () {
		Route::get('/dashboard', [DashboardController::class, 'index']);

		Route::get('/donations', [DonationModerationController::class, 'index']);
		Route::patch('/donations/{donation}', [DonationModerationController::class, 'update']);
		Route::patch('/donations/{donation}/approve', [DonationModerationController::class, 'approve']);
		Route::patch('/donations/{donation}/reject', [DonationModerationController::class, 'reject']);

		Route::get('/users', [UserManagementController::class, 'index']);
		Route::patch('/users/{user}/role', [UserManagementController::class, 'updateRole']);
		Route::patch('/users/{user}/deactivate', [UserManagementController::class, 'deactivate']);

		Route::get('/reports/donations', [ReportController::class, 'donationsCsv']);
	});
