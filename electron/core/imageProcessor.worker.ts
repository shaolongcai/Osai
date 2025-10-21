import { parentPort, workerData } from 'worker_threads';
import { Ollama } from 'ollama'
import * as fs from 'fs';

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
    try {

        // 设置超时处理
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error('图像处理超时'));
            }, 120000); // 分钟超时
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
        console.log(`转换buffer成功: ${data.imagePath}`)
        const base64Image = imageBuffer.toString('base64');


        console.log(`交付给olama: ${data.imagePath}`)



        const response = await ollama.chat({
            model: 'qwen2.5vl:3b',
            messages: [{
                role: 'user',
                content: data.prompt,
                images: [base64Image],
            }],
            options: {
                num_predict: 300,
                temperature: 0.7,
                repeat_penalty: 1.1,
                num_gpu: -1
            },
            stream: false,
        });

        console.log(response.message.content)

        // for await (const part of response) {
        //     console.log(part.message.content)
        //     // process.stdout.write(part.message.content)
        // }

        return {
            requestId: data.requestId,
            success: true,
            result: response.message.content
        };

    } catch (error) {
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