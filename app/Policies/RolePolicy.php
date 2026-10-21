<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Enums\Role as SystemRole;
use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can(Permission::RolesManage->value);
    }

    public function view(User $actor, Role $role): bool
    {
        return $actor->can(Permission::RolesManage->value);
    }

    public function create(User $actor): bool
    {
        return $actor->can(Permission::RolesManage->value);
    }

    /** Peran Admin selalu memegang semua izin, jadi tidak boleh diubah. */
    public function update(User $actor, Role $role): bool
    {
        return $actor->can(Permission::RolesManage->value) && $role->name !== SystemRole::Admin->value;
    }

    /** Peran bawaan tidak bisa dihapus, dan peran yang masih dipakai harus dikosongkan dulu. */
    public function delete(User $actor, Role $role): bool
    {
        return $actor->can(Permission::RolesManage->value)
            && SystemRole::tryFrom($role->name) === null;
    }
}
