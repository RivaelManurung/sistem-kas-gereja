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
use App\Http\Controllers\Admin\LookupOptionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\ReportSignatoryController;
use App\Http\Controllers\Admin\TransparencySettingController;
use App\Http\Controllers\Admin\ServiceScheduleController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::middleware('permission:'.Permission::UsersManage->value)->group(function () {
        Route::resource('users', UserController::class)->except(['destroy']);
        Route::patch('users/{user}/toggle', [UserController::class, 'toggle'])->name('users.toggle');
    });

    Route::middleware('permission:'.Permission::RolesManage->value)->group(function () {
        Route::resource('roles', RoleController::class)->except(['show']);
        Route::get('roles/{role}', [RoleController::class, 'show'])->whereNumber('role')->name('roles.show');
    });

    Route::middleware('permission:'.Permission::SettingsManage->value)->group(function () {
        Route::get('settings', [ChurchSettingController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [ChurchSettingController::class, 'update'])->name('settings.update');
        Route::get('transparansi', [TransparencySettingController::class, 'edit'])->name('transparency.edit');
        Route::put('transparansi', [TransparencySettingController::class, 'update'])->name('transparency.update');

        Route::resource('signatures', ReportSignatoryController::class)->except(['create', 'edit']);
        Route::patch('signatures/{signature}/toggle', [ReportSignatoryController::class, 'toggle'])->name('signatures.toggle');
    });

    Route::middleware('permission:'.Permission::MasterManage->value)->group(function () {
        Route::get('options', [LookupOptionController::class, 'index'])->name('options.index');
        Route::post('options', [LookupOptionController::class, 'store'])->name('options.store');
        Route::put('options/{option}', [LookupOptionController::class, 'update'])->name('options.update');
        Route::patch('options/{option}/toggle', [LookupOptionController::class, 'toggle'])->name('options.toggle');

        Route::resource('accounts', AccountController::class)->except(['destroy']);
        Route::patch('accounts/{account}/toggle', [AccountController::class, 'toggle'])->name('accounts.toggle');

        Route::resource('funds', FundController::class)->except(['destroy']);
        Route::patch('funds/{fund}/toggle', [FundController::class, 'toggle'])->name('funds.toggle');

        Route::resource('categories', CategoryController::class)->except(['destroy']);
        Route::patch('categories/{category}/toggle', [CategoryController::class, 'toggle'])->name('categories.toggle');

        Route::resource('attributes', AttributeDefinitionController::class)->except(['destroy']);
        Route::patch('attributes/{attribute}/toggle', [AttributeDefinitionController::class, 'toggle'])->name('attributes.toggle');

        Route::resource('schedules', ServiceScheduleController::class)->except(['destroy']);
        Route::patch('schedules/{schedule}/toggle', [ServiceScheduleController::class, 'toggle'])->name('schedules.toggle');

        Route::resource('allocations', AllocationRuleController::class)->except(['destroy']);
        Route::patch('allocations/{allocation}/toggle', [AllocationRuleController::class, 'toggle'])->name('allocations.toggle');

        Route::resource('periods', AccountingPeriodController::class)->only(['index', 'create', 'store', 'show']);
        Route::post('periods/{period}/close', [AccountingPeriodController::class, 'close'])->name('periods.close');
    });

    Route::middleware('permission:'.Permission::MembersManage->value)->group(function () {
    });

    Route::get('audit', [AuditLogController::class, 'index'])
        ->middleware('permission:'.Permission::AuditView->value)
        ->name('audit.index');
    Route::get('audit/{log}', [AuditLogController::class, 'show'])
        ->middleware('permission:'.Permission::AuditView->value)
        ->whereNumber('log')
        ->name('audit.show');
});
