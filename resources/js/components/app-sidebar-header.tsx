import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { SidebarPanel, SidebarRail } from '@/components/app-sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useSidebarNav } from '@/components/sidebar-nav-context';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { panelOpen, togglePanel, mobileOpen, setMobileOpen } = useSidebarNav();

    return (
        <header className="bg-background/85 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-2">
                <Button variant="ghost" size="icon" className="size-9 md:hidden" onClick={() => setMobileOpen(true)} aria-label="Buka menu">
                    <Menu className="size-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden size-9 md:inline-flex"
                    onClick={togglePanel}
                    aria-label={panelOpen ? 'Ciutkan submenu' : 'Tampilkan submenu'}
                    aria-pressed={panelOpen}
                >
                    {panelOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
                </Button>
                <div className="min-w-0 overflow-hidden">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            <AppearanceToggleDropdown />

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-auto max-w-[92vw] gap-0 p-0 [&>button]:hidden">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SheetDescription className="sr-only">Navigasi utama Kas Gereja</SheetDescription>
                    <div className="flex h-full">
                        <SidebarRail onNavigate={() => undefined} />
                        <SidebarPanel onNavigate={() => setMobileOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    );
}
