import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    roles?: string[];
    permissions: string[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
}

export interface Option {
    value: string;
    label: string;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: { success: string | null };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export type EventStatus = 'planning' | 'active' | 'completed' | 'closed';
export type EventRole = 'ketua' | 'sekretaris' | 'bendahara' | 'anggota';

export interface EventFinancialSummary {
    target_budget: number;
    total_income: number;
    total_expenses: number;
    remaining_balance: number;
    budget_realization_pct: number;
}

export interface Fund {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    event_id: number | null;
}

export interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    is_active: boolean;
}

export interface Category {
    id: number;
    name: string;
    direction: 'in' | 'out';
    default_fund_id: number;
    scope_event_id: number | null;
    allows_named: boolean;
    is_public: boolean;
    is_active: boolean;
}

export interface Member {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    is_active: boolean;
}

export interface EventMember {
    id: number;
    event_id: number;
    user_id: number | null;
    member_id: number | null;
    role_in_event: EventRole;
    notes: string | null;
    user?: User | null;
    member?: Member | null;
    created_at?: string;
}

export interface EventItem {
    id: number;
    name: string;
    theme: string | null;
    start_date: string;
    end_date: string | null;
    status: EventStatus;
    target_budget: number;
    description: string | null;
    fund_id: number;
    fund?: Fund;
    financial_summary?: EventFinancialSummary;
    members?: EventMember[];
    categories?: Category[];
    count_sheets?: Array<{
        id: number;
        date: string;
        sheet_number?: string;
        total_amount?: number;
        status?: string;
        account?: { name: string };
        creator?: { name: string };
    }>;
    created_at: string;
    updated_at: string;
}
