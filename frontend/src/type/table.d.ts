


type SearchDataItem  = {
    id: number;
    path: string;
    name: string;
    ext: string;
    modified_at: string;
}

interface ColumnData {
    dataKey: keyof SearchDataItem;
    label: string;
    numeric?: boolean;
    width?: number;
    styles?: {
        fontColor?: string;
    }
}