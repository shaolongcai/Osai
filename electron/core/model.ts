import { logger } from './logger.js'
import { INotification } from '../types/system.js';
import { sendToRenderer } from '../main.js';
import { setModelReady } from './appState.js';
import { ollamaService } from './ollama.js'
import ollama from 'ollama'

/**
 * 初始化并加载AI模型到内存中。
 * 这个函数在整个应用生命周期中只应被调用一次。
 */
export async function initializeModel() {
    // 如果模型已经加载，则直接返回，防止重复加载
    try {
        logger.info('启动Ollama AI服务...');

        // 启动Ollama服务
        await ollamaService.start();

        // 检查模型是否存在
        const modelExists = await listOllamaModels();
        if (!modelExists) {
            logger.info(`模型 qwen2.5vl:3b 不存在，开始拉取...`);
            await pullOllamaModel('qwen2.5vl:3b');
        }

        logger.info('AI模型已成功初始化');
        const notification: INotification = {
            id: 'downloadModel',
            text: 'AI服务已就绪',
            type: 'success',
        }
        sendToRenderer('system-info', notification)

        setModelReady(true);

    } catch (error) {
        const msg = error instanceof Error ? error.message : '模型初始化失败';
        logger.error(`模型初始化失败: ${msg}`);
        throw new Error(msg);
    }
}


// 从远端或本地添加模型
async function pullOllamaModel(modelName: string): Promise<void> {

    return new Promise(async (resolve, reject) => {
        try {

            logger.info(`开始拉取模型: ${modelName}`);

            const response = await ollama.pull({
                model: modelName,
                stream: true,
            })

            let lastProgress: number
            // 步骤1：处理流式响应数据
            for await (const part of response) {
                // 步骤2：显示下载进度
                if (part.completed && part.total) {
                    const progress = ((part.completed / part.total) * 100).toFixed(1);
                    // 显示进度（每1%显示一次）
                    if (Number(progress) % 2 === 0 && Number(progress) !== lastProgress) {
                        lastProgress = Number(progress)
                        logger.info(`下载进度: ${progress}%`);
                        // 发送进度
                        const notification: INotification = {
                            id: 'downloadModel',
                            text: `正在下载AI模型 ${Math.floor(Number(progress))}%`,
                            type: 'loading',
                            tooltip: '在AI模型下载完成前，你还可以使用传统搜索'
                        }
                        sendToRenderer('system-info', notification)
                    }

                }
            }

            // 步骤3：流处理完成后才记录完成日志
            logger.info(`模型 ${modelName} 拉取完成`);

            resolve()

        } catch (error) {
            const msg = error instanceof Error ? error.message : '模型拉取失败';
            logger.error(`模型拉取失败: ${msg}`);
            reject(new Error(msg));
        }
    })
}

// 列出模型检查
async function listOllamaModels(): Promise<boolean> {
    try {
        const response = await ollama.list();
        // logger.info(`当前可用模型: ${JSON.stringify(response.models, null, 2)}`);
        return response.models.some(model => model.name === 'qwen2.5vl:3b');
    } catch (error) {
        const msg = error instanceof Error ? error.message : '模型列表获取失败';
        logger.error(`模型列表获取失败: ${msg}`);
        throw new Error(msg);
    }
}