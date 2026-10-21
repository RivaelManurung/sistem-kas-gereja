import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useSidebarNav } from '@/components/sidebar-nav-context';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRightLeft,
    Calculator,
    Calendar,
    CalendarCheck,
    CalendarDays,
    ChevronDown,
    FileSignature,
    FileSpreadsheet,
    FileText,
    HandCoins,
    HeartHandshake,
    House,
    KeyRound,
    LayoutGrid,
    ListChecks,
    Lock,
    type LucideIcon,
    Newspaper,
    Palette,
    PartyPopper,
    PenLine,
    PieChart,
    Receipt,
    ScrollText,
    Settings,
    ShieldCheck,
    Sliders,
    Split,
    Tag,
    User,
    UserCheck,
    Users,
    Wallet,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { useMemo } from 'react';

export interface NavLeaf {
    title: string;
    url: string;
    icon: LucideIcon;
    /** Tampil bila pengguna memegang salah satu izin ini. Tanpa izin berarti tampil untuk semua. */
    anyOf?: string[];
}

export interface NavSection {
    title?: string;
    items: NavLeaf[];
}

export interface NavModule {
    key: string;
    title: string;
    icon: LucideIcon;
    sections: NavSection[];
}

/** Seluruh menu. Item yang izinnya tidak dimiliki pengguna disaring di `useNavModules`. */
const MODULES: NavModule[] = [
    {
        key: 'ringkasan',
        title: 'Ringkasan',
        icon: LayoutGrid,
        sections: [
            {
                items: [
                    { title: 'Dasbor', url: '/dashboard', icon: LayoutGrid },
                    { title: 'Portal Jemaat', url: '/portal', icon: HeartHandshake },
                    { title: 'Transparansi Publik', url: '/transparansi', icon: ShieldCheck },
                ],
            },
        ],
    },
    {
        key: 'penerimaan',
        title: 'Penerimaan',
        icon: HandCoins,
        sections: [
            {
                items: [
                    { title: 'Sesi Ibadah', url: '/sessions', icon: Calendar, anyOf: ['counting.manage'] },
                    { title: 'Berita Acara Hitung', url: '/counting', icon: Calculator, anyOf: ['counting.manage'] },
                    { title: 'Persembahan Atas Nama', url: '/donations', icon: FileText, anyOf: ['counting.manage'] },
                    { title: 'Setoran Bank', url: '/deposits', icon: ArrowRightLeft, anyOf: ['deposits.manage'] },
                ],
            },
        ],
    },
    {
        key: 'pengeluaran',
        title: 'Pengeluaran',
        icon: Receipt,
        sections: [
            {
                items: [
                    { title: 'Pengeluaran Kas', url: '/expenses', icon: Receipt, anyOf: ['expenses.view'] },
                    { title: 'Pindah Dana', url: '/transfers', icon: ArrowRightLeft, anyOf: ['transfers.view'] },
                ],
            },
        ],
    },
    {
        key: 'acara',
        title: 'Acara',
        icon: PartyPopper,
        sections: [{ items: [{ title: 'Acara & Kepanitiaan', url: '/events', icon: PartyPopper, anyOf: ['events.view', 'events.manage', 'events.participate'] }] }],
    },
    {
        key: 'laporan',
        title: 'Laporan',
        icon: FileSpreadsheet,
        sections: [
            {
                items: [
                    { title: 'Laporan Keuangan', url: '/reports', icon: FileSpreadsheet, anyOf: ['reports.view'] },
                    { title: 'Warta Mingguan', url: '/reports/bulletin', icon: Newspaper, anyOf: ['reports.view'] },
                    { title: 'Jejak Aktivitas', url: '/admin/audit', icon: ScrollText, anyOf: ['audit.view'] },
                ],
            },
        ],
    },
    {
        key: 'master',
        title: 'Master Data',
        icon: Users,
        sections: [
            {
                title: 'Jemaat dan pengguna',
                items: [
                    { title: 'Pengguna', url: '/admin/users', icon: Users, anyOf: ['users.manage'] },
                    { title: 'Peran & Hak Akses', url: '/admin/roles', icon: KeyRound, anyOf: ['roles.manage'] },
                    { title: 'Anggota Jemaat', url: '/admin/members', icon: UserCheck, anyOf: ['members.manage'] },
                    { title: 'Keluarga', url: '/admin/households', icon: House, anyOf: ['members.manage'] },
                ],
            },
            {
                title: 'Keuangan',
                items: [
                    { title: 'Rekening Kas', url: '/admin/accounts', icon: Wallet, anyOf: ['master.manage'] },
                    { title: 'Pos Dana', url: '/admin/funds', icon: PieChart, anyOf: ['master.manage'] },
                    { title: 'Kategori Kas', url: '/admin/categories', icon: Tag, anyOf: ['master.manage'] },
                    { title: 'Aturan Alokasi', url: '/admin/allocations', icon: Split, anyOf: ['master.manage'] },
                ],
            },
            {
                title: 'Ibadah',
                items: [{ title: 'Jadwal Ibadah', url: '/admin/schedules', icon: CalendarCheck, anyOf: ['master.manage'] }],
            },
        ],
    },
    {
        key: 'pengaturan',
        title: 'Pengaturan',
        icon: Settings,
        sections: [
            {
                title: 'Gereja',
                items: [
                    { title: 'Pengaturan Gereja', url: '/admin/settings', icon: Settings, anyOf: ['settings.manage'] },
                    { title: 'Periode Akuntansi', url: '/admin/periods', icon: CalendarDays, anyOf: ['master.manage'] },
                    { title: 'Penanda Tangan Laporan', url: '/admin/signatures', icon: FileSignature, anyOf: ['settings.manage'] },
                    { title: 'Field Kustom', url: '/admin/attributes', icon: Sliders, anyOf: ['master.manage'] },
                    { title: 'Opsi Dropdown', url: '/admin/options', icon: ListChecks, anyOf: ['master.manage'] },
                ],
            },
            {
                title: 'Akun saya',
                items: [
                    { title: 'Profil', url: '/settings/profile', icon: User },
                    { title: 'Tanda Tangan', url: '/settings/signature', icon: PenLine },
                    { title: 'Kata Sandi', url: '/settings/password', icon: Lock },
                    { title: 'Tampilan', url: '/settings/appearance', icon: Palette },
                ],
            },
        ],
    },
];

/** Cocokkan URL aktif ke item terpanjang yang cocok, supaya `/reports` tidak ikut aktif di `/reports/bulletin`. */
function findActive(modules: NavModule[], path: string) {
    let best: { module: NavModule; leaf: NavLeaf } | null = null;
    for (const module of modules) {
        for (const section of module.sections) {
            for (const leaf of section.items) {
                const hit = path === leaf.url || path.startsWith(leaf.url + '/');
                if (hit && (!best || leaf.url.length > best.leaf.url.length)) best = { module, leaf };
            }
        }
    }
    return best;
}

export function useNavModules() {
    const { auth } = usePage<SharedData>().props;
    const { url } = usePage();
    const permissions = auth.permissions ?? [];

    return useMemo(() => {
        const allowed = (leaf: NavLeaf) => !leaf.anyOf || leaf.anyOf.some((p) => permissions.includes(p));

        const modules = MODULES.map((m) => ({
            ...m,
            sections: m.sections.map((s) => ({ ...s, items: s.items.filter(allowed) })).filter((s) => s.items.length > 0),
        })).filter((m) => m.sections.length > 0);

        const path = url.split('?')[0].replace(/\/$/, '') || '/';
        const active = findActive(modules, path);

        return { modules, activeModuleKey: active?.module.key ?? modules[0]?.key, activeUrl: active?.leaf.url };
    }, [permissions, url]);
}

function firstUrl(module: NavModule) {
    return module.sections[0].items[0].url;
}

function Brand() {
    const { brand } = usePage<SharedData>().props;

    return (
        <Link
            href="/dashboard"
            className={cn(
                'focus-visible:ring-ring flex size-11 items-center justify-center rounded-xl shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
                brand.logo_url ? 'bg-card border' : 'bg-primary text-primary-foreground',
            )}
            aria-label={brand.name}
        >
            <BrandMark className={brand.logo_url ? 'size-8' : 'size-6'} />
        </Link>
    );
}

function RailUser() {
    const { auth } = usePage<SharedData>().props;
    const initials = useInitials()(auth.user.name);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={`Akun ${auth.user.name}`}
                    className="bg-accent text-accent-foreground hover:ring-ring/30 focus-visible:ring-ring flex size-10 items-center justify-center rounded-full text-sm font-semibold ring-2 ring-transparent transition focus-visible:ring-2 focus-visible:outline-hidden"
                >
                    {initials}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56 rounded-lg" align="end" side="right" sideOffset={12}>
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** Lapis pertama: logo dan daftar modul dengan judul besar. */
export function SidebarRail({ onNavigate }: { onNavigate?: () => void }) {
    const { modules } = useNavModules();
    const { selectedKey, setSelectedKey } = useSidebarNav();

    return (
        <nav aria-label="Modul" className="bg-sidebar-background flex h-full w-[84px] shrink-0 flex-col items-center border-r py-4">
            <Brand />
            <ul className="mt-6 flex w-full flex-1 flex-col gap-1 overflow-y-auto px-2">
                {modules.map((m) => {
                    const selected = m.key === selectedKey;
                    const Icon = m.icon;
                    return (
                        <li key={m.key}>
                            <Link
                                href={firstUrl(m)}
                                prefetch
                                onClick={() => {
                                    setSelectedKey(m.key);
                                    onNavigate?.();
                                }}
                                aria-current={selected ? 'true' : undefined}
                                className={cn(
                                    'focus-visible:ring-ring group relative flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-[11px] leading-tight font-medium transition-colors focus-visible:ring-2 focus-visible:outline-hidden',
                                    selected
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'bg-gold absolute top-2 bottom-2 -left-2 w-1 rounded-r-full transition-all duration-200',
                                        selected ? 'scale-y-100 opacity-100' : 'scale-y-50 opacity-0',
                                    )}
                                />
                                <Icon className="size-5" aria-hidden="true" />
                                <span className="text-center break-words">{m.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <div className="pt-3">
                <RailUser />
            </div>
        </nav>
    );
}

/** Lapis kedua: subjudul untuk modul yang dipilih. */
export function SidebarPanel({ onNavigate }: { onNavigate?: () => void }) {
    const { modules, activeUrl } = useNavModules();
    const { selectedKey } = useSidebarNav();
    const module = modules.find((m) => m.key === selectedKey) ?? modules[0];

    if (!module) return null;

    return (
        <div className="bg-sidebar-background/60 flex h-full w-64 shrink-0 flex-col border-r">
            <div className="flex h-14 shrink-0 items-center border-b px-5">
                <h2 className="text-base font-semibold tracking-tight">{module.title}</h2>
            </div>
            {/* key memicu transisi halus setiap pindah modul */}
            <nav
                key={module.key}
                aria-label={module.title}
                className="animate-in fade-in slide-in-from-left-1 flex-1 space-y-4 overflow-y-auto px-3 py-4 duration-200"
            >
                {module.sections.map((section, i) => (
                    <NavSectionGroup key={section.title ?? i} section={section} activeUrl={activeUrl} onNavigate={onNavigate} />
                ))}
            </nav>
        </div>
    );
}

function NavSectionGroup({ section, activeUrl, onNavigate }: { section: NavSection; activeUrl?: string; onNavigate?: () => void }) {
    const list = (
        <ul className="space-y-0.5">
            {section.items.map((leaf) => {
                const active = leaf.url === activeUrl;
                const Icon = leaf.icon;
                return (
                    <li key={leaf.url}>
                        <Link
                            href={leaf.url}
                            prefetch
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'focus-visible:ring-ring relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-hidden',
                                active
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                            )}
                        >
                            {active && <span aria-hidden="true" className="bg-gold absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full" />}
                            <Icon className={cn('size-4 shrink-0', active ? '' : 'text-muted-foreground')} aria-hidden="true" />
                            <span className="truncate">{leaf.title}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );

    if (!section.title) return list;

    return (
        <Collapsible defaultOpen className="group/section">
            <CollapsibleTrigger className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-hidden">
                {section.title}
                <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]/section:-rotate-90" aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 mt-1 overflow-hidden">
                {list}
            </CollapsibleContent>
        </Collapsible>
    );
}

export function AppSidebar() {
    const { panelOpen } = useSidebarNav();

    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden md:flex">
            <SidebarRail />
            {panelOpen && <SidebarPanel />}
        </aside>
    );
}
