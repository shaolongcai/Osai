


/**
 * 数据库索引文件表
 */
export interface IndexFile {
    id: number;
    md5: string;
    path: string;
    name: string;
    ext: string;
    size: number;
    created_at: string;
    modified_at: string;
}
