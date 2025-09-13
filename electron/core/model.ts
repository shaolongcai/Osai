import { summarizeImageWithPython } from '../pythonScript/imageService.js';










// 主要的图片摘要函数
export async function summarizeImage(imagePath: string): Promise<string> {
    try {
        return await summarizeImageWithPython(imagePath);  // task中的message.result最终返回到这里
    } catch (error) {
        // 被reject（失败）后，走这里，会 立即将这个 Promise 的拒绝原因作为异常抛出 。
        const msg = error instanceof Error ? error.message : '图片摘要生成失败';
        throw new Error(msg);
    }
}

