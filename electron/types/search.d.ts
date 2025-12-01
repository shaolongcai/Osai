
type SearchDataItem = {
    id: number;
    path: string;
    name: string;
    ext: string;
    modified_at: string;
    ai_mark: 1 | 0;
    snippet?: string; // 高亮片段（可选）
}

interface SearchResult {
    data: SearchDataItem[];
    total: number;
}

//搜索应用程序结果
type searchProgramItem = {
    display_icon?: string;
    display_name: string;
    full_pinyin: string;
    head_pinyin: string;
    id: number;
    path?: string;
    publisher: string;
}


interface shortSearchResult {
    data: {
        id: number;
        icon?: string;
        path: string;
        name: string;
    }[];
    total: number;
}