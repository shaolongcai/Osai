


interface GenerateRequest {
    path: string; //模型路径
    prompt: string; //提示词
    content?: string; //user的内容或者文档全文
    isImage?: boolean; //是否为图片
    isJson?: boolean; //是否返回json格式
    jsonFormat?: any; //json格式
}