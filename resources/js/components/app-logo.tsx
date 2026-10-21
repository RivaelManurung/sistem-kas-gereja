import { Building2 } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shadow-xs">
                <Building2 className="size-4.5" />
            </div>
            <div className="ml-1.5 grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">Kas Gereja</span>
                <span className="truncate text-[10px] text-muted-foreground">Sistem Perbendaharaan</span>
            </div>
        </>
    );
}
