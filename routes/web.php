<?php

use App\Http\Controllers\BankDepositController;
use App\Http\Controllers\CountConfirmationController;
use App\Http\Controllers\CountSheetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\EventCategoryController;
use App\Http\Controllers\EventClosingController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventExpenseController;
use App\Http\Controllers\EventMemberController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FundTransferController;
use App\Http\Controllers\MemberPortalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportVerificationController;
use App\Http\Controllers\ServiceSessionController;
use App\Http\Controllers\TransparencyController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route(auth()->check() ? 'dashboard' : 'login');
})->name('home');

// Public transparency page with rate limiting
Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('transparansi', [TransparencyController::class, 'index'])->name('transparency.index');
    Route::get('verify-report/{code}', [ReportVerificationController::class, 'verify'])->name('reports.verify');
    Route::get('verify-report/{code}/download', [ReportVerificationController::class, 'download'])->name('reports.verify.download');
});

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Financial Reports & Approvals
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('reports', [ReportController::class, 'store'])->name('reports.store');
    Route::get('reports/bulletin', [ReportController::class, 'bulletin'])->name('reports.bulletin');
    Route::get('reports/bulletin/pdf', [ReportController::class, 'bulletinPdf'])->name('reports.bulletin.pdf');
    Route::get('reports/{report}', [ReportController::class, 'show'])->name('reports.show');
    Route::get('reports/{report}/pdf', [ReportController::class, 'pdf'])->name('reports.pdf');
    Route::post('reports/{report}/approvals/{approval}/approve', [ReportController::class, 'approve'])
        ->name('reports.approve')
        ->scopeBindings();

    // Counting witness confirmation (any authenticated member can act as witness)
    Route::post('counting/{counting}/confirm', [CountConfirmationController::class, 'confirm'])->name('counting.confirm');

    // Counting & Worship Sessions (Penghitung, Bendahara, Admin)
    Route::middleware(['role:admin|bendahara|penghitung'])->group(function () {
        Route::resource('sessions', ServiceSessionController::class)->only(['index', 'create', 'store']);
        Route::resource('counting', CountSheetController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update']);
        Route::post('counting/{counting}/verify', [CountConfirmationController::class, 'verify'])->name('counting.verify');
        Route::post('counting/{counting}/lock', [CountConfirmationController::class, 'lock'])->name('counting.lock');
        Route::resource('donations', DonationController::class)->only(['index', 'create', 'store', 'show']);
    });

    // Bank Deposits (Bendahara, Admin)
    Route::middleware(['role:admin|bendahara'])->group(function () {
        Route::resource('deposits', BankDepositController::class)->only(['index', 'create', 'store']);
    });

    // Expenses (Pengeluaran)
    Route::resource('expenses', ExpenseController::class)->only(['index', 'create', 'store', 'show']);
    Route::get('expenses/{expense}/approve', [ExpenseController::class, 'approveView'])->name('expenses.approve.view');
    Route::post('expenses/{expense}/approve', [ExpenseController::class, 'approve'])->name('expenses.approve');
    Route::post('expenses/{expense}/reject', [ExpenseController::class, 'reject'])->name('expenses.reject');
    Route::post('expenses/{expense}/pay', [ExpenseController::class, 'pay'])->name('expenses.pay');

    // Fund Transfers (Pindah Dana Manual)
    Route::resource('transfers', FundTransferController::class)->only(['index', 'create', 'store', 'show']);
    Route::post('transfers/{transfer}/approve', [FundTransferController::class, 'approve'])->name('transfers.approve');
    Route::post('transfers/{transfer}/reject', [FundTransferController::class, 'reject'])->name('transfers.reject');

    // Events (Acara & Kepanitiaan)
    Route::resource('events', EventController::class);
    Route::post('events/{event}/close', [EventClosingController::class, 'close'])->name('events.close');
    Route::post('events/{event}/expenses', [EventExpenseController::class, 'store'])->name('events.expenses.store');
    Route::post('events/{event}/members', [EventMemberController::class, 'store'])->name('events.members.store');
    Route::delete('events/{event}/members/{member}', [EventMemberController::class, 'destroy'])->name('events.members.destroy');
    Route::post('events/{event}/categories', [EventCategoryController::class, 'store'])->name('events.categories.store');

    // Member Portal (Portal Jemaat)
    Route::get('portal', [MemberPortalController::class, 'index'])->name('portal.index');
    Route::get('portal/statement', [MemberPortalController::class, 'statement'])->name('portal.statement');
    Route::get('portal/receipt/{donation}', [MemberPortalController::class, 'receipt'])->name('portal.receipt');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
require __DIR__.'/auth.php';
