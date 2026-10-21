import { DefinitionList, DetailCard } from '@/components/app/detail';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LinkRow } from '@/components/app/link-row';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/date';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Props {
    rule: {
        id: number;
        name: string;
        valid_from: string;
        is_active: boolean;
        category: { id: number; name: string } | null;
        items: Array<{ id: number; fund_id: number; fund_code: string | null; fund_name: string | null; percentage: number; sort_order: number }>;
    };
}

export default function AllocationShow({ rule }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Aturan Alokasi Dana', href: '/admin/allocations' },
        { title: rule.name, href: '#' },
    ];
    const total = Math.round(rule.items.reduce((sum, i) => sum + i.percentage, 0) * 100) / 100;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={rule.name} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    back="/admin/allocations"
                    title={rule.name}
                    description="Aturan pembagian persembahan ke pos dana."
                    actions={
                        <Button asChild>
                            <Link href={route('admin.allocations.edit', rule.id)}>Ubah</Link>
                        </Button>
                    }
                />

                <DetailCard title="Identitas">
                    <DefinitionList
                        columns={3}
                        items={[
                            { label: 'Nama aturan', value: rule.name },
                            { label: 'Kategori persembahan', value: rule.category?.name },
                            { label: 'Berlaku mulai', value: formatDate(rule.valid_from) },
                            { label: 'Status', value: <StatusBadge active={rule.is_active} /> },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Pembagian pos dana" flush>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dana</TableHead>
                                <TableHead className="text-right">Persentase</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rule.items.map((i) => (
                                <LinkRow key={i.id} href={route('admin.funds.show', i.fund_id)}>
                                    <TableCell>
                                        {i.fund_code} - {i.fund_name}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{i.percentage}%</TableCell>
                                </LinkRow>
                            ))}
                            <TableRow className="bg-muted/50">
                                <TableCell className="font-medium">Total</TableCell>
                                <TableCell className={`text-right font-medium tabular-nums ${total === 100 ? 'text-income' : 'text-expense'}`}>{total}%</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </DetailCard>
            </div>
        </AppLayout>
    );
}
