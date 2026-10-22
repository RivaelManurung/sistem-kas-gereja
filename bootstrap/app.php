<?php

use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            \Illuminate\Support\Facades\Route::middleware('web')->group(base_path('routes/members.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // The app runs behind Coolify's proxy, which terminates TLS and forwards the original scheme and host.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            EnsureUserIsActive::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Sesi atau token halaman kedaluwarsa (419): kembali ke halaman asal dengan pesan, bukan layar "Page Expired".
        $exceptions->respond(function (SymfonyResponse $response, Throwable $e, Request $request) {
            if ($response->getStatusCode() === 419) {
                return redirect()->back(fallback: route('login'))
                    ->with('error', 'Sesi Anda sudah berakhir. Halaman sudah dimuat ulang, silakan coba lagi.');
            }

            return $response;
        });
    })->create();
