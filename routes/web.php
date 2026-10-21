<?php

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
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
require __DIR__.'/auth.php';
