<?php

namespace App\Enums;

enum Permission: string
{
    case SettingsManage = 'settings.manage';
    case MasterManage = 'master.manage';
    case UsersManage = 'users.manage';
    case MembersManage = 'members.manage';
    case AuditView = 'audit.view';
}
