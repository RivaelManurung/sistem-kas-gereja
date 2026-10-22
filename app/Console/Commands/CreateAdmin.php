<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {--name=} {--email=} {--password=}';

    protected $description = 'Create the first admin account (reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD when options are omitted)';

    public function handle(): int
    {
        $data = [
            'name' => $this->option('name') ?: env('ADMIN_NAME', 'Admin Gereja'),
            'email' => $this->option('email') ?: env('ADMIN_EMAIL'),
            'password' => $this->option('password') ?: env('ADMIN_PASSWORD'),
        ];

        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:10'],
        ], ['password.min' => 'Password admin minimal 10 karakter.']);

        if ($validator->fails()) {
            $this->error(implode(' ', $validator->errors()->all()));

            return self::FAILURE;
        }

        if (User::where('email', $data['email'])->exists()) {
            $this->info("Akun {$data['email']} sudah ada, dilewati.");

            return self::SUCCESS;
        }

        $user = User::create($data);
        $user->forceFill(['email_verified_at' => now()])->save();
        $user->assignRole(Role::Admin->value);

        $this->info("Admin {$user->email} dibuat.");

        return self::SUCCESS;
    }
}
