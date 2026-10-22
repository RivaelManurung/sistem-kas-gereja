import { SidebarNavProvider } from '@/components/sidebar-nav-context';
import { AppSidebar, useNavModules } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useSidebarNav } from '@/components/sidebar-nav-context';
import FlashMessage from '@/components/flash-message';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';

function Frame({ children, breadcrumbs }: { children: React.ReactNode; breadcrumbs: BreadcrumbItem[] }) {
    const { panelOpen } = useSidebarNav();

    return (
        <div className="bg-background min-h-dvh">
            <AppSidebar />
            <div className={cn('flex min-h-dvh flex-col transition-[padding] duration-200 print:block print:min-h-0 print:pl-0', panelOpen ? 'md:pl-[340px]' : 'md:pl-[84px]')}>
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <main className="flex flex-1 flex-col">
                    <FlashMessage />
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    const { activeModuleKey } = useNavModules();

    return (
        <SidebarNavProvider activeModuleKey={activeModuleKey}>
            <Frame breadcrumbs={breadcrumbs}>{children}</Frame>
        </SidebarNavProvider>
    );
}
