import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface SidebarNavState {
    /** Modul yang sedang ditampilkan di lapis kedua. */
    selectedKey: string | undefined;
    setSelectedKey: (key: string) => void;
    /** Lapis kedua (subjudul) tampil atau diciutkan di desktop. */
    panelOpen: boolean;
    togglePanel: () => void;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const SidebarNavContext = createContext<SidebarNavState | null>(null);

const STORAGE_KEY = 'sidebar-panel';

export function SidebarNavProvider({ activeModuleKey, children }: { activeModuleKey: string | undefined; children: React.ReactNode }) {
    const [override, setOverride] = useState<string | undefined>();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [panelOpen, setPanelOpen] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) !== 'closed';
        } catch {
            return true;
        }
    });

    // Setelah berpindah halaman, ikuti modul dari halaman yang aktif.
    useEffect(() => setOverride(undefined), [activeModuleKey]);

    const togglePanel = useCallback(() => {
        setPanelOpen((open) => {
            try {
                localStorage.setItem(STORAGE_KEY, open ? 'closed' : 'open');
            } catch {
                /* penyimpanan tidak tersedia, abaikan */
            }
            return !open;
        });
    }, []);

    const value = useMemo(
        () => ({ selectedKey: override ?? activeModuleKey, setSelectedKey: setOverride, panelOpen, togglePanel, mobileOpen, setMobileOpen }),
        [override, activeModuleKey, panelOpen, togglePanel, mobileOpen],
    );

    return <SidebarNavContext.Provider value={value}>{children}</SidebarNavContext.Provider>;
}

export function useSidebarNav() {
    const ctx = useContext(SidebarNavContext);
    if (!ctx) throw new Error('useSidebarNav harus dipakai di dalam SidebarNavProvider');
    return ctx;
}
