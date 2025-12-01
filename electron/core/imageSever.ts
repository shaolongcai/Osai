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
import { createWorker } from 'tesseract.js';
import * as fs from 'fs';
import pathConfig from './pathConfigs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * 图片处理服务:AI摘要
 */
export class ImageSever {

    private imageWorker: Worker | null
    private pendingImages: Map<string, { resolve: Function; reject: Function }>
    private db: Database
    private ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

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

    /**
    * OCR索引
    * @param imagePath 
    * @returns 图片文本内容
    */
    public processImage = (imagePath: string): Promise<string> => {

        const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB：過大的圖片容易導致 wasm 报错

        return new Promise(async (resolve, reject) => {
            try {
                // 基本校验：過大文件直接跳過，避免 Aborted(-1)
                try {
                    const stat = fs.statSync(imagePath);
                    if (stat.size > MAX_IMAGE_SIZE) {
                        return reject(new Error('图片过大，已跳过（>20MB）'));
                    }
                } catch { /* 忽略 stat 失败 */ }


                const ret = await this.ocrWorker.recognize(imagePath);
                resolve(ret.data.text)
            } catch (error) {
                const msg = error instanceof Error ? error.message : '图片处理失败';
                logger.error(`图片处理失败: ${msg}`);
                reject(new Error(msg));
            }
        });
    }

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

    /**
     * 开启视觉索引服务
     * OCR Worker 單例：避免重複初始化導致內存暴漲與崩潰
     */
    private getOCRWorker = async () => {
        if (this.ocrWorker) return this.ocrWorker;

        const resourcesPath = pathConfig.get('resources');
        const cacheRoot = path.join(pathConfig.get('cache'), 'tesseract');
        // 確保緩存目錄存在
        try {
            if (!fs.existsSync(cacheRoot)) fs.mkdirSync(cacheRoot, { recursive: true });
        } catch (e) {
            logger.error(`创建 Tesseract 缓存目录失败: ${String(e)}`);
        }

        try {
            this.ocrWorker = await createWorker(['chi_sim', 'chi_tra', 'eng'], 1, {
                langPath: path.join(resourcesPath, 'traineddata'),
                cachePath: cacheRoot,
                gzip: true,
                // 錯誤處理：捕獲 worker 線程錯誤，避免應用直接崩潰
                errorHandler: (err: unknown) => {
                    const msg = err instanceof Error ? err.message : String(err);
                    logger.error(`OCR Worker 错误: ${msg}`);
                },
                logger: (m: unknown) => {
                    // 只保留初始化階段的關鍵日誌，避免刷屏
                    const s = typeof m === 'string' ? m : JSON.stringify(m);
                    if (s.includes('initialized') || s.includes('loaded_lang_model')) {
                        logger.info(`OCR: ${s}`);
                    }
                }
            });
            return this.ocrWorker;
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'OCR Worker 初始化失败';
            logger.error(`OCR 初始化失败: ${msg}`);
            // 降級策略：僅使用英語模型再次嘗試
            try {
                this.ocrWorker = await createWorker(['eng'], 1, {
                    langPath: path.join(resourcesPath, 'traineddata'),
                    cachePath: cacheRoot,
                    gzip: true,
                });
                return this.ocrWorker;
            } catch (e2) {
                const m2 = e2 instanceof Error ? e2.message : String(e2);
                logger.error(`OCR 英語模型降級仍失敗: ${m2}`);
                throw new Error(msg);
            }
        }
    }


    /**
     * 释放OCR Worker
     * @returns
     */
    public async terminateOCRWorker() {
        if (this.ocrWorker) {
            try {
                await this.ocrWorker.terminate();
            } catch (e) {
                logger.error(`OCR Worker 终止失败: ${String(e)}`);
            }
            this.ocrWorker = null;
        }
    }

    // 新增：静态工厂，负责异步初始化（如OCR Worker）
    static async create(): Promise<ImageSever> {
        const instance = new ImageSever();
        try {
            // 步骤：异步初始化OCR（如需）
            if (typeof (instance as any).getOCRWorker === 'function') {
                instance.ocrWorker = await (instance as any).getOCRWorker();
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : '初始化OCR失败';
            // 仅记录，不阻塞AI流程
            logger.warn(`初始化OCR失败: ${msg}`);
        }
        return instance;
    }
}