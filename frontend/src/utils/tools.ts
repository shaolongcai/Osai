
// 步骤1: 创建扩展名到文件类型的映射
const EXTENSION_TO_TYPE_MAP: Record<string, string> = {
    // 图片类型
    '.png': 'IMAGE',
    '.jpg': 'IMAGE',
    '.jpeg': 'IMAGE',

    // Office文档类型
    '.ppt': 'PPT',
    '.pptx': 'PPT',
    '.doc': 'WORD',
    '.docx': 'WORD',
    '.xlsx': 'EXCEL',
    '.xls': 'EXCEL',

    // 其他文档类型
    '.csv': 'CSV',
    '.txt': 'TEXT',
    '.pdf': 'PDF',

    //应用程序
    '.exe': 'EXE',
};

// 步骤2: 根据扩展名获取文件类型的函数
export const getFileTypeByExtension = (extension: string): string => {
    // 转换为小写以确保匹配
    const lowerExt = extension.toLowerCase();

    // 返回对应的文件类型，如果没有找到，则视为文件夹
    return EXTENSION_TO_TYPE_MAP[lowerExt] || '文件夹';
}