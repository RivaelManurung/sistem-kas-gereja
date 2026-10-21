<?php

use App\Http\Controllers\BankDepositController;
use App\Http\Controllers\CountConfirmationController;
use App\Http\Controllers\CountSheetController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\EventCategoryController;
use App\Http\Controllers\EventClosingController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventExpenseController;
use App\Http\Controllers\EventMemberController;
use App\Http\Controllers\ServiceSessionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('sessions', ServiceSessionController::class)->only(['index', 'create', 'store']);
    Route::resource('counting', CountSheetController::class);
    Route::post('counting/{counting}/confirm', [CountConfirmationController::class, 'confirm'])->name('counting.confirm');
    Route::post('counting/{counting}/verify', [CountConfirmationController::class, 'verify'])->name('counting.verify');
    Route::post('counting/{counting}/lock', [CountConfirmationController::class, 'lock'])->name('counting.lock');
    Route::resource('donations', DonationController::class);
    Route::resource('deposits', BankDepositController::class)->only(['index', 'create', 'store']);

    Route::resource('events', EventController::class);
    Route::post('events/{event}/close', [EventClosingController::class, 'close'])->name('events.close');
    Route::post('events/{event}/expenses', [EventExpenseController::class, 'store'])->name('events.expenses.store');
    Route::post('events/{event}/members', [EventMemberController::class, 'store'])->name('events.members.store');
    Route::delete('events/{event}/members/{member}', [EventMemberController::class, 'destroy'])->name('events.members.destroy');
    Route::post('events/{event}/categories', [EventCategoryController::class, 'store'])->name('events.categories.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
require __DIR__.'/auth.php';
