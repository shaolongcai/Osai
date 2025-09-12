


interface DataItem {
    id: number;
    name: string;
    path: string;
}

interface ColumnData {
    dataKey: keyof DataItem;
    label: string;
    numeric?: boolean;
    width?: number;
    styles?: {
        fontColor?: string;
    }
}