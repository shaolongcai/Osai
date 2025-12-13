import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { logger } from '../core/logger.js';
import { INotification, INotification2 } from '../types/system.js';
import { getDatabase } from '../database/sqlite.js';
import { Database } from 'better-sqlite3';
import { sendToRenderer } from '../main.js';
import { fileURLToPath } from 'url';
import { createWorker } from 'tesseract.js';
import pathConfig from '../core/pathConfigs.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * 图片处理服务:AI摘要
 */
export class OcrSever {

    // private pendingImages: Map<string, { resolve: Function; reject: Function }>
    private db: Database
    private ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;
    // 新增：队列与去重集合、处理标记
    private queue: Array<{ imagePath: string; resolve: (text: string) => void; reject: (err: Error) => void }> = [];
    private enqueued = new Set<string>();
    private processing = false;


    constructor() {
        // this.pendingImages = new Map()
        this.db = getDatabase()
    }

    // 1、统一入口，入队并返回识别结果
    public enqueue(imagePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // 去重：同一文件只入队一次
            if (this.enqueued.has(imagePath)) {
                resolve(''); // 已在队列中，直接返回空字符串或可改为等待现有任务结果
                return;
            }
            this.enqueued.add(imagePath);
            this.queue.push({ imagePath, resolve, reject });
            this.processQueue(); // 触发处理
        });
    }


    // 裁剪队列：移除 skip_ocr=1 的文件（📌 这里无法跳过不存在的path，因为不在数据库）
    private pruneQueueBySkipFlag() {
        try {
            const paths = this.queue.map(t => t.imagePath);
            if (paths.length === 0) return;

            const placeholders = paths.map(() => '?').join(', ');
            const stmt = this.db.prepare(`SELECT path FROM files WHERE skip_ocr = 1 AND path IN (${placeholders})`);
            const rows = stmt.all(...paths);
            const skipSet = new Set(rows.map((r: { path: string }) => r.path));

            if (skipSet.size === 0) return;

            const kept: typeof this.queue = [];
            for (const task of this.queue) {
                if (skipSet.has(task.imagePath)) {
                    try {
                        task.resolve('');
                    } catch (_) { }
                    this.enqueued.delete(task.imagePath);
                } else {
                    kept.push(task);
                }
            }
            this.queue = kept;
        } catch (error) {
            const msg = error instanceof Error ? error.message : '批量裁剪失败';
            logger.error(`批量裁剪 skip_ocr 队列失败: ${msg}`);
        }
    }

    // 2、队列处理（串行）
    private async processQueue() {
        if (this.processing) return;
        this.processing = true;

        try {
            // 确保 OCR Worker 就绪
            await this.ensureWorker();
            // 检查队列中是否有skip_ocr=1的文件，裁剪队列
            this.pruneQueueBySkipFlag();

            while (this.queue.length > 0) {
                const task = this.queue.shift()!;
                const { imagePath, resolve, reject } = task;

                // 如果imagePath 包含 营业执照 则跳过
                if (imagePath.includes('营业执照')) {
                    console.log('营业执照 找到', imagePath)
                }

                try {
                    // UI提示剩余任务
                    const notification: INotification2 = {
                        id: 'ocr',
                        messageKey: 'app.search.ocrSever',
                        variables: { count: this.queue.length + 1 },
                        type: 'loadingQuestion',
                        tooltip: 'app.search.ocrSeverTips',
                    }
                    sendToRenderer('system-info', notification)

                    // 识别图片（内部已限流与大小校验）
                    const text = await this.processImage(imagePath);
                    const success = this.insertOCRResult(imagePath, text);
                    resolve(text);
                } catch (error) {
                    const msg = error instanceof Error ? error.message : '图片处理失败';
                    // logger.warn(`OCR 服务处理失败: ${msg} ${imagePath}`);
                } finally {
                    // 更新数据库记录无需再OCR
                    const updateStmt = this.db.prepare(`UPDATE files SET skip_ocr = 1 WHERE path = ?`);
                    updateStmt.run(imagePath);
                    // 出列与去重清理
                    this.enqueued.delete(imagePath);
                    if (this.enqueued.size === 0) {
                        const notification: INotification2 = {
                            id: 'ocr',
                            messageKey: 'app.search.ocrSuccess',
                            type: 'success',
                        }
                        sendToRenderer('system-info', notification)
                    }
                }
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'OCR 队列处理失败';
            logger.error(`OCR 队列处理失败: ${msg}`);
            // 将队列中的任务全部失败返回
            while (this.queue.length > 0) {
                const task = this.queue.shift()!;
                task.reject(new Error(msg));
            }
        } finally {
            this.processing = false;
        }
    }

    //使用OCR做索引
    private processImage = (imagePath: string): Promise<string> => {

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

                let timeoutId: NodeJS.Timeout;
                const timeout = new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error('OCR 处理超时（60秒）'));
                    }, 60000);
                })

                const ret = await Promise.race([
                    this.ocrWorker.recognize(imagePath),
                    timeout
                ]);
                clearTimeout(timeoutId);
                resolve(ret.data.text)
            } catch (error) {
                const msg = error instanceof Error ? error.message : '图片处理失败';
                logger.error(`processImage处理失败: ${msg}`);
                reject(new Error(msg));
            }
        });
    }

    // 入库操作
    private insertOCRResult = (imagePath: string, text: string) => {
        try {
            if(imagePath.includes('营业执照')){
                console.log(text)
            }

            // 获取更多详情
            const file = fs.statSync(imagePath);
            const size = file.size;
            const modifiedAt = Math.floor(file.mtimeMs);
            const name = path.basename(imagePath).toLowerCase();
            const ext = path.extname(imagePath).toLowerCase();
            // 计算MD5
            const metadataString = `${imagePath}-${size}-${modifiedAt}`;
            const md5 = crypto.createHash('md5').update(metadataString).digest('hex');

            // 原子 UPSERT：存在即更新，不存在则插入
            const upsertStmt = this.db.prepare(`
                INSERT INTO files (md5, path, name, ext, full_content, size, modified_at, skip_ocr)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(path) DO UPDATE SET
                    md5 = excluded.md5,
                    size = excluded.size,
                    modified_at = excluded.modified_at,
                    full_content = excluded.full_content,
                    skip_ocr = 1
            `);
            const res = upsertStmt.run(md5, imagePath, name, ext, text, size, modifiedAt);
            logger.info(`图片OCR索引成功: ${imagePath} (changes=${res.changes})`);

            // const updateStmt = this.db.prepare(`UPDATE files SET md5 = ?, full_content = ?, size = ?, modified_at = ?, skip_ocr = 1 WHERE path = ?`);
            // const res = updateStmt.run(md5, text, size, modifiedAt, imagePath);
            // if (res.changes > 0) {
            //     logger.info(`OCR 索引成功: ${imagePath}`);
            //     return true;
            // }
            // // 没有记录，则插入一条新的记录
            // const insertStmt = this.db.prepare(
            //     `INSERT OR IGNORE INTO files (md5, path, name, ext, full_content, size, modified_at, skip_ocr)
            //      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
            // );
            // const inserRes = insertStmt.run(md5, imagePath, name, ext, text, size, modifiedAt);
            // if (inserRes.changes > 0) {
            //     logger.info(`OCR 索引插入成功: ${imagePath}`);
            //     return true;
            // }
        } catch (error) {
            logger.error(`insertOCRResult处理失败: ${error}`);
        }
    }

    // 新增：确保 Worker
    private async ensureWorker() {
        if (!this.ocrWorker) {
            this.ocrWorker = await this.getOCRWorker();
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

            await this.ocrWorker.setParameters({

                // OEM: 1 使用 LSTM 引擎，中文效果更好
                oem: '1',
                // 保留空格，对英文与数字混排更友好
                preserve_interword_spaces: '1',
                // 指定 DPI，有助于提升版面分析与识别
                user_defined_dpi: '300'
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
    static async create(): Promise<OcrSever> {
        const instance = new OcrSever();
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

//单例导出
export const ocrSeverSingleton = await OcrSever.create();