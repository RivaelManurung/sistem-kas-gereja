export type AttributeType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'file';

export interface AttributeDefinition {
    id: number;
    key: string;
    label: string;
    data_type: AttributeType;
    options: string[] | null;
    is_required: boolean;
}

export interface CustomFieldsProp {
    definitions: AttributeDefinition[];
    values: Record<string, any>;
}
