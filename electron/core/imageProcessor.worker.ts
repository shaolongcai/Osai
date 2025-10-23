import { parentPort } from 'worker_threads';
import { Ollama } from 'ollama'
import * as fs from 'fs';
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

interface ImageProcessRequest {
    imagePath: string;
    prompt: string;
    requestId: string;
}

interface ImageProcessResponse {
    requestId: string;
    success: boolean;
    result?: string;
    error?: string;
}

// 处理图像的核心逻辑
async function processImageInWorker(data: ImageProcessRequest): Promise<ImageProcessResponse> {
    let timeoutId: NodeJS.Timeout;
    try {
        // 设置超时处理
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error('图像处理超时'));
            }, 4 * 60 * 1000); // 4分钟超时
        });

        console.log(`开始处理图像: ${data.imagePath}`)

        // 先检查文件是否存在
        if (!fs.existsSync(data.imagePath)) {
            throw new Error(`文件不存在: ${data.imagePath}`);
        }
        const ollama = new Ollama();
        // 检查文件权限
        try {
            await fs.promises.access(data.imagePath, fs.constants.R_OK);
        } catch (accessError) {
            throw new Error(`文件无法访问: ${data.imagePath}`);
        }
        // 读取图片并转换为base64
        const imageBuffer = await fs.promises.readFile(data.imagePath);
        const base64Image = imageBuffer.toString('base64');

        // JSON结构
        const schema = z.object({
            tags: z.array(z.string()),
            summary: z.string(),
        })

        const chatResponse = ollama.chat({
            model: 'qwen2.5vl:3b',
            messages: [{
                role: 'user',
                content: '输出摘要以及若干个标签，标签数量限制在5~7个，摘要控制在300字以内,不要重复内容。',
                images: [base64Image],
            }],
            options: {
                num_predict: 500,
                temperature: 0.7,
                repeat_penalty: 1.1,
            },
            stream: false,
            format: zodToJsonSchema(schema),
        });

        const response = await Promise.race([chatResponse, timeoutPromise]);
        clearTimeout(timeoutId);

        return {
            requestId: data.requestId,
            success: true,
            result: response.message.content
        };

    } catch (error) {
        clearTimeout(timeoutId);
        const msg = error instanceof Error ? error.message : '图像处理失败';
        console.error(msg);
        return {
            requestId: data.requestId,
            success: false,
            error: msg
        };
    }
}

// 监听主线程消息
parentPort?.on('message', async (data: ImageProcessRequest) => {
    const result = await processImageInWorker(data);
    parentPort?.postMessage(result);
});