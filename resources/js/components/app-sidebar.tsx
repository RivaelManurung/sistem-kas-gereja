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

type PermittedNavItem = NavItem & { permission: string };

const mainNavItems: NavItem[] = [
    {
        title: 'Dasbor',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Sesi Ibadah',
        url: '/sessions',
        icon: Calendar,
    },
    {
        title: 'Berita Acara Hitung',
        url: '/counting',
        icon: Calculator,
    },
    {
        title: 'Persembahan Atas Nama',
        url: '/donations',
        icon: FileText,
    },
    {
        title: 'Acara & Kepanitiaan',
        url: '/events',
        icon: PartyPopper,
    },
    {
        title: 'Setoran Bank',
        url: '/deposits',
        icon: ArrowRightLeft,
    },
    {
        title: 'Pengeluaran Kas',
        url: '/expenses',
        icon: Receipt,
    },
    {
        title: 'Pindah Dana',
        url: '/transfers',
        icon: ArrowRightLeft,
    },
    {
        title: 'Laporan Keuangan',
        url: '/reports',
        icon: FileSpreadsheet,
    },
    {
        title: 'Warta Mingguan',
        url: '/reports/bulletin',
        icon: Newspaper,
    },
];

const adminNavItems: PermittedNavItem[] = [
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
                {visibleAdminItems.length > 0 && <NavMain label="Administrasi & Master" items={visibleAdminItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
