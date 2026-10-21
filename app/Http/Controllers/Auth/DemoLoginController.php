<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Masuk satu klik ke akun contoh dari DemoDataSeeder. Mati kecuali APP_DEMO_LOGIN=true,
 * dan hanya mau memasukkan akun contoh yang terdaftar di bawah ini.
 */
class DemoLoginController extends Controller
{
    /** @var array<string, string> email => nama peran */
    public const ACCOUNTS = [
        'admin@gereja.test' => 'Admin',
        'bendahara@gereja.test' => 'Bendahara',
        'majelis@gereja.test' => 'Majelis/Ketua',
        'penghitung@gereja.test' => 'Penghitung',
        'panitia@gereja.test' => 'Panitia Acara',
        'pemeriksa@gereja.test' => 'Pemeriksa',
        'jemaat@gereja.test' => 'Jemaat',
    ];

    /** @return list<array{email: string, role: string, name: string}> */
    public static function accounts(): array
    {
        if (! config('app.demo_login')) {
            return [];
        }

        $users = User::whereIn('email', array_keys(self::ACCOUNTS))->where('is_active', true)->pluck('name', 'email');

        return collect(self::ACCOUNTS)
            ->filter(fn (string $role, string $email) => $users->has($email))
            ->map(fn (string $role, string $email) => ['email' => $email, 'role' => $role, 'name' => $users[$email]])
            ->values()
            ->all();
    }

    public function __invoke(Request $request): RedirectResponse
    {
        abort_unless(config('app.demo_login'), 404);

        $email = (string) $request->validate(['email' => ['required', 'string']])['email'];
        abort_unless(array_key_exists($email, self::ACCOUNTS), 404);

        $user = User::where('email', $email)->where('is_active', true)->firstOrFail();

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
