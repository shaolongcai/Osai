import * as path from 'path';
import { Worker } from 'worker_threads';
import { logger } from '../core/logger.js';
import { INotification } from '../types/system.js';
import { getDatabase } from '../database/sqlite.js';
import { Database } from 'better-sqlite3';
import { sendToRenderer } from '../main.js';
import { fileURLToPath } from 'url';
import { ollamaService } from './ollama.js';
import { ImagePrompt } from '../data/prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * 图片处理服务:AI摘要
 */
export class ImageSever {

    private imageWorker: Worker | null
    private pendingImages: Map<string, { resolve: Function; reject: Function }>
    private db: Database


    constructor() {
        this.initializeImageWorker()
        this.pendingImages = new Map()
        this.db = getDatabase()
    }


    /**
     * AI Mark 图片,对外服务主要使用这个
     * @param filePath 图片路径
     */
    public async processImageByAi(filePath: string) {
        const aiResponseString = await ollamaService.generate({
            path: filePath,
            prompt: ImagePrompt,
            content: `图片标题: ${filePath.split('/').pop()}`,
            isImage: true,
            isJson: true,
        })

        const aiResponse = JSON.parse(aiResponseString)

        const updateStmt = this.db.prepare(`UPDATE files SET summary = ?, tags = ?, ai_mark = 1, skip_ocr = 1 WHERE path = ?`);
        const res = updateStmt.run(aiResponse.summary, JSON.stringify(aiResponse.tags), filePath);
        if (res.changes > 0) {
            logger.info(`AI Mark 图片更新成功`);
            const notification: INotification = {
                id: 'ai-mark',
                text: `AI 正在记录文档... 剩余 ${this.pendingImages.size}`,
                type: 'loading',
                // tooltip: ''
            }
            sendToRenderer('system-info', notification)
            this.handleFinishImageProcessed(filePath)
        }
    }


    // 初始化图片处理Worker
    private initializeImageWorker() {
        try {
            const workerPath = path.join(__dirname, '../workers/imageProcessor.worker.js');
            this.imageWorker = new Worker(workerPath);

            // 监听Worker消息
            this.imageWorker.on('message', (response: any) => {
                const { requestId, success, result, error } = response;
                const pending = this.pendingImages.get(requestId);

                if (pending) {
                    this.pendingImages.delete(requestId);
                    if (success) {
                        pending.resolve(result);
                    } else {
                        pending.reject(new Error(error)); //这里reject到file.ts 然后报错，后期在这里加上重试
                    }
                }
            });

            // 监听Worker错误
            this.imageWorker.on('error', (error) => {
                console.error(`图片处理Worker错误: ${error.message}`);
                // 重启Worker
                // restartImageWorker();
            });

            // 监听Worker退出
            this.imageWorker.on('exit', (code) => {
                if (code !== 0) {
                    console.warn(`图片处理Worker异常退出，代码: ${code}`);
                    // restartImageWorker();
                }
            });

        } catch (error) {
            console.error(`初始化图片处理Worker失败: ${error}`);
        }
    };


    // 使用线程处理图片
    private processImageWithWorker = (imagePath: string, prompt: string = '请使用中文摘要这张图片，请简洁描述，不要重复内容，控制在300字以内'): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!this.imageWorker) {
                reject(new Error('图片处理Worker未初始化'));
                return;
            }

            const requestId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 存储Promise的resolve和reject
            this.pendingImages.set(requestId, { resolve, reject });

            // 发送任务到Worker
            this.imageWorker.postMessage({
                imagePath,
                prompt,
                requestId
            });
        });
    };

    // 处理完成的图片，发送消息
    private handleFinishImageProcessed = (filePath: string) => {
        this.pendingImages.delete(filePath);
        if (this.pendingImages.size === 0) {
            const notification: INotification = {
                id: 'ai-mark',
                text: `AI Mark已完成`,
                type: 'success',
                // tooltip: ''
            }
            sendToRenderer('system-info', notification)
        }
    }
}