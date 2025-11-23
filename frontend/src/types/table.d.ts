


type SearchDataItem = {
    id: number;
    path: string;
    name: string;
    ext: string;
    modified_at: string;
    ai_mark: number;
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


// 快捷搜索的类型
type shortSearchDataItem = {
    id: number;
    icon?: string;
    path: string;
    name: string;
    ext?: string;
    aiMark: 1 | 0;
}

// 快捷搜索类型
interface shortSearchResult {
    data: shortSearchDataItem[];
    total: number;
}
