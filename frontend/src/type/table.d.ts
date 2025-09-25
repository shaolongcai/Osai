


type SearchDataItem = {
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
    },
    sortable?: boolean; //是否允许排序
    render?: (value: SearchDataItem[keyof SearchDataItem]) => string | React.ReactNode; //自定义渲染组件
}