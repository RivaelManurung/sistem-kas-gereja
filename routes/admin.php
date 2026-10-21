<?php

use App\Enums\Permission;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::middleware('permission:'.Permission::UsersManage->value)->group(function () {
        Route::resource('users', UserController::class)->except(['show', 'destroy']);
        Route::patch('users/{user}/toggle', [UserController::class, 'toggle'])->name('users.toggle');
    });

    Route::get('audit', [AuditLogController::class, 'index'])
        ->middleware('permission:'.Permission::AuditView->value)
        ->name('audit.index');
});
