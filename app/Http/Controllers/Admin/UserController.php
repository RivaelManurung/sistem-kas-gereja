<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRequest;
use App\Enums\Permission;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\AuditPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role as RoleModel;

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
                'roles' => $user->roles->map(fn ($r) => $r->label ?? Role::tryFrom($r->name)?->label() ?? $r->name)->all(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roleOptions' => $this->roleOptions(),
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        $this->authorize('view', $user);

        $user->load('roles:id,name,label');
        $granted = $user->getAllPermissions()->pluck('name')->all();
        $actor = $request->user();
        $member = $user->member()->first(['id', 'name']);

        $logs = AuditLog::query()
            ->with('user:id,name')
            ->where('auditable_type', 'user')
            ->where('auditable_id', $user->id)
            ->orderByDesc('id')
            ->limit(15)
            ->get();
        $presenter = new AuditPresenter($logs);

        return Inertia::render('admin/users/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at?->toIso8601String(),
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            ],
            'member' => $member ? [
                'id' => $member->id,
                'name' => $member->name,
                'url' => Route::has('admin.members.show') && $actor->can(Permission::MembersManage->value)
                    ? route('admin.members.show', $member->id)
                    : null,
            ] : null,
            'roles' => $user->roles->map(fn (RoleModel $r) => [
                'id' => $r->id,
                'label' => $r->label ?? Role::tryFrom($r->name)?->label() ?? $r->name,
                'url' => $actor->can(Permission::RolesManage->value) ? route('admin.roles.show', $r->id) : null,
            ])->values()->all(),
            'groups' => collect(Permission::grouped())->map(fn (array $group) => [
                'group' => $group['group'],
                'permissions' => collect($group['permissions'])->map(fn (array $p) => [...$p, 'granted' => in_array($p['value'], $granted, true)])->all(),
            ])->all(),
            'permissionsCount' => count($granted),
            'logs' => $logs->map(fn (AuditLog $log) => $presenter->summary($log))->all(),
            'canToggle' => $actor->can('toggle', $user),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('admin/users/form', [
            'user' => null,
            'roleOptions' => $this->roleOptions(),
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
            'roleOptions' => $this->roleOptions(),
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

    /** @return list<array{value: string, label: string}> */
    private function roleOptions(): array
    {
        return RoleModel::query()->orderBy('label')->get(['name', 'label'])
            ->map(fn (RoleModel $r) => ['value' => $r->name, 'label' => $r->label ?? Role::tryFrom($r->name)?->label() ?? $r->name])
            ->all();
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
