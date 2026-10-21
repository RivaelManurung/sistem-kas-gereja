import { DefinitionList, DetailCard, StatTiles } from '@/components/app/detail';
import PageHeader from '@/components/page-header';
import StatusBadge from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Props {
    signatory: {
        id: number;
        title: string;
        position: string;
        role: string | null;
        role_label: string | null;
        user: { id: number; name: string; email: string } | null;
        order: number;
        is_active: boolean;
        approvals_count: number;
        reports_count: number;
    };
}

export default function SignatureShow({ signatory: s }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Susunan Penanda Tangan & Stempel', href: '/admin/signatures' },
        { title: s.position, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={s.position} />
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader
                    title={s.position}
                    description={s.title}
                    actions={
                        <Button asChild>
                            <Link href={route('admin.signatures.index', { edit: s.id })}>Ubah</Link>
                        </Button>
                    }
                />

                <StatTiles
                    items={[
                        { label: 'Laporan beku yang memakai', value: s.reports_count },
                        { label: 'Total pengesahan', value: s.approvals_count },
                        { label: 'Urutan', value: s.order },
                    ]}
                />

                <DetailCard title="Rincian penanda tangan">
                    <DefinitionList
                        items={[
                            { label: 'Judul pengesahan', value: s.title },
                            { label: 'Jabatan resmi', value: s.position },
                            { label: 'Peran akun', value: s.role_label },
                            { label: 'Pengguna khusus', value: s.user ? `${s.user.name} (${s.user.email})` : 'Siapa pun sesuai peran' },
                            { label: 'Urutan tanda tangan', value: s.order },
                            { label: 'Status', value: <StatusBadge active={s.is_active} /> },
                        ]}
                    />
                </DetailCard>

                <DetailCard title="Dipakai di mana" description="Penanda tangan muncul pada laporan keuangan resmi.">
                    <p className="text-sm leading-relaxed">
                        Saat laporan dibekukan, setiap penanda tangan aktif menjadi satu langkah pengesahan yang harus ditandatangani dari akunnya sendiri. Susunan ini sudah tercatat pada {s.reports_count} laporan beku ({s.approvals_count} pengesahan).
                        {!s.is_active && ' Karena nonaktif, penanda tangan ini tidak ikut pada laporan berikutnya.'}
                    </p>
                </DetailCard>
            </div>
        </AppLayout>
    );
}
