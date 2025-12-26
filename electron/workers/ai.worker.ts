import { parentPort } from 'worker_threads';
import { Message, Ollama } from 'ollama'
import * as fs from 'fs';
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'


interface ProcessResponse {
    requestId: string;
    success: boolean;
    result?: string; //返回的结果，若传入json格式，则返回后需要格式化
    error?: string;
}

// AI处理的核心逻辑
async function aiInWorker(data: GenerateRequest & { requestId: string }): Promise<ProcessResponse> {

    let timeoutId: NodeJS.Timeout;
    let schema: z.ZodObject<any, any>;
    const ollama = new Ollama();
    const model = 'qwen2.5vl:3b'

    try {
        // 设置超时处理
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                return {
                    requestId: data.requestId,
                    success: false,
                    error: '文档处理超时',
                    // needRestartOllama: true,
                };
            }, 4 * 60 * 1000); // 4分钟超时
        });
        // JSON结构
        if (data.isJson) {
            schema = data.jsonFormat || {
                type: 'object',
                properties: {
                    tags: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                    summary: {
                        type: 'string',
                    },
                },
                required: ['tags', 'summary'],
            }
        }
        // const schema =  z.object({
        //         tags: z.array(z.string()),
        //         summary: z.string(),
        //     })
        const messages: Message[] = [
            {
                role: 'user',
                content: `${data.prompt} + ${data.content}`,
                // content: '你好吗？',
            }
        ]
        // 是否为图片
        if (data.isImage) {
            // 读取图片并转换为base64
            const imageBuffer = await fs.promises.readFile(data.path);
            const base64Image = imageBuffer.toString('base64');
            messages[messages.length - 1].images = [base64Image];
        }

        const chatResponse = await ollama.chat({
            model: model,
            messages: messages,
            options: {
                num_predict: 1200,
                temperature: 0,
                repeat_penalty: 1.2,
            },
            format: data.isJson ? schema : undefined,
        });

        const response = await Promise.race([chatResponse, timeoutPromise]);
        clearTimeout(timeoutId);
        // console.log('AI响应:', response.message.content)

        return {
            requestId: data.requestId,
            success: true,
            result: response.message.content,
        };

    } catch (error) {
        clearTimeout(timeoutId);
        const msg = error instanceof Error ? error.message : '文档处理失败';
        console.error(msg);
        return {
            requestId: data.requestId,
            success: false,
            error: msg,
            // needRestartOllama: true,
        };
    }
}

// 监听主线程消息
parentPort?.on('message', async (data: GenerateRequest & { requestId: string }) => {
    const result = await aiInWorker(data);
    parentPort?.postMessage(result);
});