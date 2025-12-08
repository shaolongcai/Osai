

/**
 * 生成请求参数
 * @param path 文件路径（图片时需要）
 * @param prompt 提示词
 * @param content user的内容或者文档全文
 * @param isImage 是否为图片
 * @param isJson 是否返回json格式
 * @param jsonFormat json格式
 */
interface GenerateRequest {
    path?: string;
    prompt: string;
    content?: string;
    isImage?: boolean;
    isJson?: boolean;
    jsonFormat?: any;
}