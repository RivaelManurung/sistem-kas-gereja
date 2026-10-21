import { Badge } from '@/components/ui/badge';

export default function StatusBadge({ active }: { active: boolean }) {
    return <Badge variant={active ? 'default' : 'secondary'}>{active ? 'Aktif' : 'Nonaktif'}</Badge>;
}
