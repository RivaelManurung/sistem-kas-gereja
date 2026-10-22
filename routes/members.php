<?php

use App\Enums\Permission;
use App\Http\Controllers\Admin\HouseholdController;
use App\Http\Controllers\Admin\MemberController;
use App\Http\Controllers\Admin\MemberRecordController;
use App\Http\Controllers\Admin\WilayahController;
use App\Http\Controllers\Admin\WilayahOfficerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'permission:'.Permission::MembersManage->value])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('members', MemberController::class)->except(['destroy']);
    Route::patch('members/{member}/toggle', [MemberController::class, 'toggle'])->name('members.toggle');
    Route::get('members/{member}/photo', [MemberController::class, 'photo'])->name('members.photo');

    Route::prefix('members/{member}')->name('members.')->group(function () {
        Route::post('milestones', [MemberRecordController::class, 'storeMilestone'])->name('milestones.store');
        Route::put('milestones/{milestone}', [MemberRecordController::class, 'updateMilestone'])->name('milestones.update');
        Route::delete('milestones/{milestone}', [MemberRecordController::class, 'destroyMilestone'])->name('milestones.destroy');

        Route::post('ministries', [MemberRecordController::class, 'storeMinistry'])->name('ministries.store');
        Route::put('ministries/{ministry}', [MemberRecordController::class, 'updateMinistry'])->name('ministries.update');
        Route::delete('ministries/{ministry}', [MemberRecordController::class, 'destroyMinistry'])->name('ministries.destroy');

        Route::post('documents', [MemberRecordController::class, 'storeDocument'])->name('documents.store');
        Route::get('documents/{document}', [MemberRecordController::class, 'downloadDocument'])->name('documents.download');
        Route::delete('documents/{document}', [MemberRecordController::class, 'destroyDocument'])->name('documents.destroy');
    });

    Route::resource('households', HouseholdController::class)->except(['destroy']);
    Route::patch('households/{household}/toggle', [HouseholdController::class, 'toggle'])->name('households.toggle');
    Route::post('households/{household}/members', [HouseholdController::class, 'attachMember'])->name('households.members.attach');
    Route::delete('households/{household}/members/{member}', [HouseholdController::class, 'detachMember'])->name('households.members.detach');

    Route::resource('wilayah', WilayahController::class)->except(['destroy'])->parameters(['wilayah' => 'wilayah']);
    Route::patch('wilayah/{wilayah}/toggle', [WilayahController::class, 'toggle'])->name('wilayah.toggle');
    Route::post('wilayah/{wilayah}/officers', [WilayahOfficerController::class, 'store'])->name('wilayah.officers.store');
    Route::put('wilayah/{wilayah}/officers/{officer}', [WilayahOfficerController::class, 'update'])->name('wilayah.officers.update');
    Route::delete('wilayah/{wilayah}/officers/{officer}', [WilayahOfficerController::class, 'destroy'])->name('wilayah.officers.destroy');
});
