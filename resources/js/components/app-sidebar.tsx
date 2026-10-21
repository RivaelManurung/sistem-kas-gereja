import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRightLeft,
    Calculator,
    Calendar,
    CalendarCheck,
    CalendarDays,
    FileSignature,
    FileSpreadsheet,
    FileText,
    HeartHandshake,
    LayoutGrid,
    Newspaper,
    PartyPopper,
    PieChart,
    Receipt,
    Settings,
    ShieldCheck,
    Sliders,
    Split,
    Tag,
    UserCheck,
    Users,
    Wallet,
} from 'lucide-react';
import AppLogo from './app-logo';

interface RoleNavItem extends NavItem {
    roles?: string[];
    permission?: string;
}

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const userRoles = auth.roles ?? [];
    const permissions = auth.permissions ?? [];

    const hasAnyRole = (roles?: string[]) => {
        if (!roles || roles.length === 0) return true;
        return roles.some((r) => userRoles.includes(r));
    };

    // 1. Ringkasan
    const ringkasanItems: NavItem[] = [
        { title: 'Dasbor', url: '/dashboard', icon: LayoutGrid },
        { title: 'Portal Jemaat', url: '/portal', icon: HeartHandshake },
        { title: 'Transparansi Publik', url: '/transparansi', icon: ShieldCheck },
    ];

    // 2. Penerimaan
    const penerimaanItems: RoleNavItem[] = [
        { title: 'Sesi Ibadah', url: '/sessions', icon: Calendar, roles: ['admin', 'bendahara', 'penghitung'] },
        { title: 'Berita Acara Hitung', url: '/counting', icon: Calculator, roles: ['admin', 'bendahara', 'penghitung'] },
        { title: 'Persembahan Atas Nama', url: '/donations', icon: FileText, roles: ['admin', 'bendahara', 'penghitung'] },
        { title: 'Setoran Bank', url: '/deposits', icon: ArrowRightLeft, roles: ['admin', 'bendahara'] },
    ].filter((item) => hasAnyRole(item.roles));

    // 3. Pengeluaran & Mutasi
    const pengeluaranItems: RoleNavItem[] = [
        { title: 'Pengeluaran Kas', url: '/expenses', icon: Receipt, roles: ['admin', 'bendahara', 'majelis', 'panitia'] },
        { title: 'Pindah Dana', url: '/transfers', icon: ArrowRightLeft, roles: ['admin', 'bendahara', 'majelis'] },
    ].filter((item) => hasAnyRole(item.roles));

    // 4. Acara
    const acaraItems: RoleNavItem[] = [
        { title: 'Acara & Kepanitiaan', url: '/events', icon: PartyPopper, roles: ['admin', 'bendahara', 'panitia', 'majelis'] },
    ].filter((item) => hasAnyRole(item.roles) || permissions.includes('events.manage'));

    // 5. Laporan Keuangan
    const laporanItems: RoleNavItem[] = [
        { title: 'Laporan Keuangan', url: '/reports', icon: FileSpreadsheet, roles: ['admin', 'bendahara', 'majelis', 'pemeriksa'] },
        { title: 'Warta Mingguan', url: '/reports/bulletin', icon: Newspaper, roles: ['admin', 'bendahara', 'majelis', 'pemeriksa'] },
    ].filter((item) => hasAnyRole(item.roles));

    // 6. Master Data & Administrasi (Permission-based)
    const adminNavItems: Array<NavItem & { permission: string }> = [
        { title: 'Pengguna', url: '/admin/users', icon: Users, permission: 'users.manage' },
        { title: 'Anggota Jemaat', url: '/admin/members', icon: UserCheck, permission: 'members.manage' },
        { title: 'Rekening Kas', url: '/admin/accounts', icon: Wallet, permission: 'master.manage' },
        { title: 'Pos Dana', url: '/admin/funds', icon: PieChart, permission: 'master.manage' },
        { title: 'Kategori Kas', url: '/admin/categories', icon: Tag, permission: 'master.manage' },
        { title: 'Aturan Alokasi', url: '/admin/allocations', icon: Split, permission: 'master.manage' },
        { title: 'Jadwal Ibadah', url: '/admin/schedules', icon: CalendarCheck, permission: 'master.manage' },
        { title: 'Periode Akuntansi', url: '/admin/periods', icon: CalendarDays, permission: 'master.manage' },
        { title: 'Field Kustom (EAV)', url: '/admin/attributes', icon: Sliders, permission: 'master.manage' },
        { title: 'Pengaturan Gereja', url: '/admin/settings', icon: Settings, permission: 'settings.manage' },
        { title: 'Susunan Penanda Tangan', url: '/admin/signatures', icon: FileSignature, permission: 'settings.manage' },
        { title: 'Audit Trail', url: '/admin/audit', icon: ShieldCheck, permission: 'audit.view' },
    ];
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
                <NavMain label="Ringkasan" items={ringkasanItems} />
                {penerimaanItems.length > 0 && <NavMain label="Penerimaan" items={penerimaanItems} />}
                {pengeluaranItems.length > 0 && <NavMain label="Pengeluaran & Mutasi" items={pengeluaranItems} />}
                {acaraItems.length > 0 && <NavMain label="Acara" items={acaraItems} />}
                {laporanItems.length > 0 && <NavMain label="Laporan Keuangan" items={laporanItems} />}
                {visibleAdminItems.length > 0 && <NavMain label="Master & Administrasi" items={visibleAdminItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
