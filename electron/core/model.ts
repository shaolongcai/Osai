import { logger } from './logger.js'
import { INotification } from '../types/system.js';
import { sendToRenderer } from '../main.js';
import { setModelReady } from './appState.js';
import ollama from 'ollama'
import { reportErrorToWechat } from './system.js';
import { setConfig } from '../database/sqlite.js';

/**
 * 初始化模型
 */
export async function initializeModel() {
    // 如果模型已经加载，则直接返回，防止重复加载
    try {
        logger.info('正在初始化模型...');
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
        setConfig('aiModel_installed', true, 'boolean');
        setModelReady(true);

    } catch (error) {
        const msg = error instanceof Error ? error.message : '模型初始化失败';
        logger.error(`模型初始化失败: ${msg}`);
        throw new Error(msg);
    }
}


// 从远端或本地添加模型
async function pullOllamaModel(modelName: string): Promise<void> {

    // 记录开始时间
    const startTime = Date.now();

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
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
                            tooltip: '在AI模型下载完成前，你可以随时进行搜索'
                        }
                        sendToRenderer('system-info', notification)
                    }

                }
            }
            // 流处理完成后才记录完成日志
            logger.info(`模型 ${modelName} 拉取完成`);
            // 记录结束时间
            const endTime = Date.now();
            // 计算耗时
            const duration = (endTime - startTime) / 1000; // 转换为秒
            logger.info(`模型 ${modelName} 拉取耗时: ${duration.toFixed(2)} 秒`);

            // 报告到企业微信
            const errorData = {
                类型: '拉取模型成功',
                模型名称: modelName,
                耗时: `${duration.toFixed(2)} 秒`,
            };
            reportErrorToWechat(errorData)
            return

        } catch (error) {
            const msg = error instanceof Error ? error.message : '模型拉取失败';
            lastError = new Error(msg);
            logger.error(`模型拉取失败 (第${attempt}次尝试): ${msg}`);

            // 如果不是最后一次尝试，等待后重试
            if (attempt < maxRetries) {
                const waitTime = attempt * 2000; // 递增等待时间：2秒、4秒
                logger.info(`等待${waitTime}ms后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    // 3次失败再抛出错误
    const finalMsg = lastError?.message || '模型拉取失败';
    logger.error(`模型拉取失败，已重试${maxRetries}次: ${finalMsg}`);

    const notification: INotification = {
        id: 'downloadModel',
        text: `模型下载失败，已重试${maxRetries}次`,
        type: 'warning',
        tooltip: '请检查网络连接或重启应用'
    };
    sendToRenderer('system-info', notification);
    throw new Error(`模型拉取失败，已重试${maxRetries}次: ${finalMsg}`);
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