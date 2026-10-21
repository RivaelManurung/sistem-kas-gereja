<?php

use App\Enums\Permission;
use App\Http\Controllers\Admin\AccountController;
use App\Http\Controllers\Admin\AccountingPeriodController;
use App\Http\Controllers\Admin\AllocationRuleController;
use App\Http\Controllers\Admin\AttributeDefinitionController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ChurchSettingController;
use App\Http\Controllers\Admin\FundController;
use App\Http\Controllers\Admin\MemberController;
use App\Http\Controllers\Admin\ReportSignatoryController;
use App\Http\Controllers\Admin\ServiceScheduleController;
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

        Route::resource('signatures', ReportSignatoryController::class)->except(['create', 'show', 'edit']);
        Route::patch('signatures/{signature}/toggle', [ReportSignatoryController::class, 'toggle'])->name('signatures.toggle');
    });

    Route::middleware('permission:'.Permission::MasterManage->value)->group(function () {
        Route::resource('accounts', AccountController::class)->except(['show', 'destroy']);
        Route::patch('accounts/{account}/toggle', [AccountController::class, 'toggle'])->name('accounts.toggle');

        Route::resource('funds', FundController::class)->except(['show', 'destroy']);
        Route::patch('funds/{fund}/toggle', [FundController::class, 'toggle'])->name('funds.toggle');

        Route::resource('categories', CategoryController::class)->except(['show', 'destroy']);
        Route::patch('categories/{category}/toggle', [CategoryController::class, 'toggle'])->name('categories.toggle');

        Route::resource('attributes', AttributeDefinitionController::class)->except(['show', 'destroy']);
        Route::patch('attributes/{attribute}/toggle', [AttributeDefinitionController::class, 'toggle'])->name('attributes.toggle');

        Route::resource('schedules', ServiceScheduleController::class)->except(['show', 'destroy']);
        Route::patch('schedules/{schedule}/toggle', [ServiceScheduleController::class, 'toggle'])->name('schedules.toggle');

        Route::resource('allocations', AllocationRuleController::class)->except(['show', 'destroy']);
        Route::patch('allocations/{allocation}/toggle', [AllocationRuleController::class, 'toggle'])->name('allocations.toggle');

        Route::resource('periods', AccountingPeriodController::class)->only(['index', 'create', 'store']);
        Route::post('periods/{period}/close', [AccountingPeriodController::class, 'close'])->name('periods.close');
    });

    Route::middleware('permission:'.Permission::MembersManage->value)->group(function () {
        Route::resource('members', MemberController::class)->except(['show', 'destroy']);
        Route::patch('members/{member}/toggle', [MemberController::class, 'toggle'])->name('members.toggle');
    });

    Route::get('audit', [AuditLogController::class, 'index'])
        ->middleware('permission:'.Permission::AuditView->value)
        ->name('audit.index');
});
