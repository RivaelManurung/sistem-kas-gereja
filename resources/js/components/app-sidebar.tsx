import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users } from 'lucide-react';
import AppLogo from './app-logo';

type PermittedNavItem = NavItem & { permission: string };

const mainNavItems: NavItem[] = [
    {
        title: 'Dasbor',
        url: '/dashboard',
        icon: LayoutGrid,
    },
];

const adminNavItems: PermittedNavItem[] = [{ title: 'Pengguna', url: '/admin/users', icon: Users, permission: 'users.manage' }];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.permissions ?? [];
    const visibleAdminItems = adminNavItems.filter((item) => permissions.includes(item.permission));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {visibleAdminItems.length > 0 && <NavMain label="Administrasi" items={visibleAdminItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
