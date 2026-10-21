<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->with('roles:id,name')
            ->orderBy('name')
            ->paginate(25)
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'roles' => $user->roles->pluck('name')->all(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roleOptions' => Role::options(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('admin/users/form', [
            'user' => null,
            'roleOptions' => Role::options(),
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        DB::transaction(function () use ($request) {
            $user = User::create([
                ...$request->safe()->only(['name', 'email', 'password']),
                'email_verified_at' => now(),
            ]);
            $this->syncRoles($user, $request->roles());
        });

        return to_route('admin.users.index')->with('success', 'Pengguna berhasil dibuat.');
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('admin/users/form', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames()->all(),
            ],
            'roleOptions' => Role::options(),
        ]);
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        DB::transaction(function () use ($request, $user) {
            $data = $request->safe()->only(['name', 'email']);
            if ($request->filled('password')) {
                $data['password'] = $request->validated('password');
            }
            $user->update($data);
            $this->syncRoles($user, $request->roles());
        });

        return to_route('admin.users.index')->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function toggle(User $user): RedirectResponse
    {
        $this->authorize('toggle', $user);

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('success', $user->is_active ? 'Pengguna diaktifkan.' : 'Pengguna dinonaktifkan.');
    }

    /**
     * @param  list<string>  $roles
     */
    private function syncRoles(User $user, array $roles): void
    {
        $old = $user->getRoleNames()->sort()->values()->all();
        $user->syncRoles($roles);
        $new = $user->getRoleNames()->sort()->values()->all();

        if ($old !== $new) {
            AuditLog::record($user, 'roles_synced', ['roles' => $old], ['roles' => $new]);
        }
    }
}
