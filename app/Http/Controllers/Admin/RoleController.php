<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Permission;
use App\Enums\Role as SystemRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RoleRequest;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::query()
            ->withCount(['users', 'permissions'])
            ->orderByRaw("case name when 'admin' then 0 else 1 end")
            ->orderBy('label')
            ->get()
            ->map(fn (Role $role) => $this->summary($role));

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'totalPermissions' => count(Permission::cases()),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Role::class);

        $copy = $request->integer('copy') ? Role::with('permissions')->find($request->integer('copy')) : null;

        return Inertia::render('admin/roles/form', [
            'role' => null,
            'groups' => Permission::grouped(),
            'granted' => $copy?->permissions->pluck('name')->all() ?? [],
            'copiedFrom' => $copy ? $this->label($copy) : null,
            'grantable' => $this->grantable($request),
        ]);
    }

    public function store(RoleRequest $request): RedirectResponse
    {
        $this->authorize('create', Role::class);

        $role = DB::transaction(function () use ($request) {
            $role = Role::create([
                'name' => $this->uniqueName($request->validated('label')),
                'guard_name' => 'web',
                'label' => $request->validated('label'),
                'description' => $request->validated('description'),
            ]);
            $role->syncPermissions($request->validated('permissions'));

            AuditLog::record($role, 'created', [], [
                'label' => $role->label,
                'description' => $role->description,
                'permissions' => $this->permissionLabels($request->validated('permissions')),
            ]);

            return $role;
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return to_route('admin.roles.show', $role)->with('success', "Peran {$role->label} berhasil dibuat.");
    }

    public function show(Role $role): Response
    {
        $this->authorize('view', $role);

        $role->load('permissions:id,name');
        $granted = $role->permissions->pluck('name')->all();

        return Inertia::render('admin/roles/show', [
            'role' => $this->summary($role),
            'groups' => collect(Permission::grouped())->map(fn (array $group) => [
                'group' => $group['group'],
                'permissions' => collect($group['permissions'])->map(fn (array $p) => [...$p, 'granted' => in_array($p['value'], $granted, true)])->all(),
            ])->all(),
            'users' => $role->users()->orderBy('name')->get(['users.id', 'users.name', 'users.email', 'users.is_active'])->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'is_active' => (bool) $u->is_active,
            ]),
            'canEdit' => request()->user()->can('update', $role),
            'canDelete' => request()->user()->can('delete', $role),
        ]);
    }

    public function edit(Request $request, Role $role): Response
    {
        $this->authorize('update', $role);

        $role->load('permissions:id,name');

        return Inertia::render('admin/roles/form', [
            'role' => $this->summary($role),
            'groups' => Permission::grouped(),
            'granted' => $role->permissions->pluck('name')->all(),
            'copiedFrom' => null,
            'grantable' => $this->grantable($request),
        ]);
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        $this->authorize('update', $role);

        DB::transaction(function () use ($request, $role) {
            $before = [
                'label' => $role->label,
                'description' => $role->description,
                'permissions' => $this->permissionLabels($role->permissions->pluck('name')->all()),
            ];

            $role->update([
                'label' => $request->validated('label'),
                'description' => $request->validated('description'),
            ]);
            $role->syncPermissions($request->validated('permissions'));
            $role->load('permissions');

            $after = [
                'label' => $role->label,
                'description' => $role->description,
                'permissions' => $this->permissionLabels($role->permissions->pluck('name')->all()),
            ];

            if ($before !== $after) {
                AuditLog::record($role, 'updated', $before, $after);
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return to_route('admin.roles.show', $role)->with('success', "Peran {$role->label} berhasil diperbarui.");
    }

    public function destroy(Role $role): RedirectResponse
    {
        $this->authorize('delete', $role);

        if ($role->users()->exists()) {
            return back()->with('error', 'Peran ini masih dipakai pengguna. Pindahkan pengguna ke peran lain terlebih dahulu.');
        }

        $label = $this->label($role);
        AuditLog::record($role, 'deleted', ['label' => $label], []);
        $role->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return to_route('admin.roles.index')->with('success', "Peran {$label} dihapus.");
    }

    /** @return array<string, mixed> */
    private function summary(Role $role): array
    {
        $system = SystemRole::tryFrom($role->name);

        return [
            'id' => $role->id,
            'name' => $role->name,
            'label' => $this->label($role),
            'description' => $role->description,
            'is_system' => $system !== null,
            'is_locked' => $system === SystemRole::Admin,
            'users_count' => $role->users_count ?? $role->users()->count(),
            'permissions_count' => $role->permissions_count ?? $role->permissions->count(),
        ];
    }

    private function label(Role $role): string
    {
        return $role->label ?? SystemRole::tryFrom($role->name)?->label() ?? Str::headline($role->name);
    }

    /**
     * @param  list<string>  $names
     * @return list<string>
     */
    private function permissionLabels(array $names): array
    {
        return collect($names)->map(fn (string $n) => Permission::tryFrom($n)?->label() ?? $n)->sort()->values()->all();
    }

    /** Izin yang boleh diberikan pengguna ini ke peran lain. */
    private function grantable(Request $request): array
    {
        return collect(Permission::cases())->filter(fn (Permission $p) => $request->user()->can($p->value))->map->value->values()->all();
    }

    private function uniqueName(string $label): string
    {
        $base = Str::slug($label) ?: 'peran';
        $name = $base;
        $i = 2;
        while (Role::where('name', $name)->exists()) {
            $name = $base.'-'.$i++;
        }

        return $name;
    }
}
