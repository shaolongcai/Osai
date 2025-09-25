
type SearchDataItem  = {
    id: number;
    path: string;
    name: string;
    ext: string;
    modified_at: string;
}

interface SearchResult {
    data: SearchDataItem[];
    total: number;
}