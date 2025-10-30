
export enum FileType {
    Document = 'document',
    Image = 'image',
    Other = 'other',
}

// 扩展名到文件类型的映射
export const FILE_TYPE_MAP = new Map<string, FileType>([
    // 图片类型
    ['.png', FileType.Image],
    ['.jpg', FileType.Image],
    ['.jpeg', FileType.Image],

    // 文档类型
    ['.doc', FileType.Document],
    ['.docx', FileType.Document],
    ['.pdf', FileType.Document],
    ['.txt', FileType.Document],
    ['.md', FileType.Document],
    ['.markdown', FileType.Document],

    // 表格文档
    ['.xls', FileType.Document],
    ['.xlsx', FileType.Document],
    ['.csv', FileType.Document],
    ['.numbers', FileType.Document],

    // 演示文档
    ['.ppt', FileType.Document],
    ['.pptx', FileType.Document],
    ['.key', FileType.Document],

    // 电子书
    ['.epub', FileType.Document],
    ['.mobi', FileType.Document],
    ['.azw', FileType.Document],
    ['.azw3', FileType.Document],
])

/**
 * 根据文件扩展名获取文件类型
 * @param ext 文件路径
 * @returns 文件类型枚举
 */
export function getFileTypeByExtension(ext: string): FileType {
    return FILE_TYPE_MAP.get(ext) || FileType.Other;
}