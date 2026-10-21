<?php

use App\Enums\Permission;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\ChurchSettingController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::middleware('permission:'.Permission::UsersManage->value)->group(function () {
        Route::resource('users', UserController::class)->except(['show', 'destroy']);
        Route::patch('users/{user}/toggle', [UserController::class, 'toggle'])->name('users.toggle');
    });

    Route::middleware('permission:'.Permission::SettingsManage->value)->group(function () {
        Route::get('settings', [ChurchSettingController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [ChurchSettingController::class, 'update'])->name('settings.update');
    });

    Route::get('audit', [AuditLogController::class, 'index'])
        ->middleware('permission:'.Permission::AuditView->value)
        ->name('audit.index');
});
