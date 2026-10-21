<?php

namespace App\Policies;

use App\Enums\EventRole;
use App\Enums\Permission;
use App\Models\Event;
use App\Models\EventMember;
use App\Models\User;

class EventPolicy
{
    private function isStaffOrAuditor(User $user): bool
    {
        return $user->canAny([Permission::EventsView->value, Permission::EventsManage->value]);
    }

    public function viewAny(User $user): bool
    {
        if ($this->isStaffOrAuditor($user)) {
            return true;
        }

        return $user->can(Permission::EventsParticipate->value)
            && EventMember::where('user_id', $user->id)->exists();
    }

    public function view(User $user, Event $event): bool
    {
        if ($this->isStaffOrAuditor($user)) {
            return true;
        }

        return $event->members()->where('user_id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::EventsManage->value);
    }

    public function update(User $user, Event $event): bool
    {
        if ($user->can(Permission::EventsManage->value)) {
            return true;
        }

        return $event->members()
            ->where('user_id', $user->id)
            ->whereIn('role_in_event', [EventRole::Ketua->value, EventRole::Bendahara->value, EventRole::Sekretaris->value])
            ->exists();
    }

    public function delete(User $user, Event $event): bool
    {
        return $user->can(Permission::EventsManage->value);
    }

    public function close(User $user, Event $event): bool
    {
        if ($user->can(Permission::EventsManage->value)) {
            return true;
        }

        return $event->members()
            ->where('user_id', $user->id)
            ->where('role_in_event', EventRole::Ketua->value)
            ->exists();
    }

    public function submitExpense(User $user, Event $event): bool
    {
        if ($this->isStaffOrAuditor($user)) {
            return true;
        }

        return $event->members()->where('user_id', $user->id)->exists();
    }

    public function manageMembers(User $user, Event $event): bool
    {
        if ($user->can(Permission::EventsManage->value)) {
            return true;
        }

        return $event->members()
            ->where('user_id', $user->id)
            ->whereIn('role_in_event', [EventRole::Ketua->value, EventRole::Sekretaris->value])
            ->exists();
    }
}
