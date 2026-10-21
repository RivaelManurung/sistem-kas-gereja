import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { type AttributeDefinition } from '@/types/attributes';

interface DynamicFieldsProps {
    definitions: AttributeDefinition[];
    values: Record<string, any>;
    errors?: Record<string, string>;
    onChange: (key: string, value: any) => void;
}

export default function DynamicFields({
    definitions,
    values,
    errors = {},
    onChange,
}: DynamicFieldsProps) {
    if (!definitions || definitions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 rounded-lg border p-4 bg-card">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Kolom Tambahan (Kustom)
            </h3>
            <div className="space-y-4">
                {definitions.map((def) => {
                    const errorKey = `attributes.${def.key}`;
                    const errorMsg = errors[errorKey];
                    const val = values[def.key];

                    return (
                        <div key={def.id} className="space-y-1">
                            {def.data_type === 'boolean' ? (
                                <div className="flex items-center justify-between rounded-md border p-3">
                                    <Label htmlFor={`attr_${def.key}`} className="cursor-pointer">
                                        {def.label} {def.is_required && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Switch
                                        id={`attr_${def.key}`}
                                        checked={Boolean(val)}
                                        onCheckedChange={(checked) => onChange(def.key, checked)}
                                    />
                                </div>
                            ) : def.data_type === 'select' ? (
                                <div className="space-y-1">
                                    <Label htmlFor={`attr_${def.key}`}>
                                        {def.label} {def.is_required && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Select
                                        value={val ? String(val) : ''}
                                        onValueChange={(selected) => onChange(def.key, selected)}
                                    >
                                        <SelectTrigger id={`attr_${def.key}`}>
                                            <SelectValue placeholder={`Pilih ${def.label}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(def.options || []).map((opt) => (
                                                <SelectItem key={opt} value={opt}>
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : def.data_type === 'file' ? (
                                <div className="space-y-1">
                                    <Label htmlFor={`attr_${def.key}`}>
                                        {def.label} {def.is_required && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Input
                                        id={`attr_${def.key}`}
                                        type="file"
                                        onChange={(e) => onChange(def.key, e.target.files ? e.target.files[0] : null)}
                                    />
                                </div>
                            ) : def.data_type === 'number' ? (
                                <div className="space-y-1">
                                    <Label htmlFor={`attr_${def.key}`}>
                                        {def.label} {def.is_required && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Input
                                        id={`attr_${def.key}`}
                                        type="number"
                                        step="0.0001"
                                        value={val !== undefined && val !== null ? String(val) : ''}
                                        onChange={(e) => onChange(def.key, e.target.value)}
                                        required={def.is_required}
                                    />
                                </div>
                            ) : def.data_type === 'date' ? (
                                <div className="space-y-1">
                                    <Label htmlFor={`attr_${def.key}`}>
                                        {def.label} {def.is_required && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Input
                                        id={`attr_${def.key}`}
                                        type="date"
                                        value={val ? String(val) : ''}
                                        onChange={(e) => onChange(def.key, e.target.value)}
                                        required={def.is_required}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label htmlFor={`attr_${def.key}`}>
                                        {def.label} {def.is_required && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Input
                                        id={`attr_${def.key}`}
                                        value={val ? String(val) : ''}
                                        onChange={(e) => onChange(def.key, e.target.value)}
                                        required={def.is_required}
                                    />
                                </div>
                            )}

                            <InputError message={errorMsg} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
