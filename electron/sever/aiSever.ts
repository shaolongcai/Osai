import * as path from 'path';
import * as fs from 'fs';
import { Database } from 'better-sqlite3';
import { getDatabase } from '../database/sqlite.js';
import { FileType } from '../units/enum.js';
import { ollamaService } from './ollamaSever.js';
import { ImagePrompt, DocumentPrompt } from '../data/prompt.js';
import { logger } from '../core/logger.js';
import * as crypto from 'crypto';
import { normalizeWinPath } from '../units/pathUtils.js';
import { documentSeverSingleton } from './documentSever.js';

/**
 * AI服务，提供文本摘要、图片摘要、问题回答
 * 队列管理：逐个处理队列中的任务，避免并发请求
 */
class AiSever {

    private queue: { filePath: string, fileType: FileType, resolve: Function; reject: Function }[] = [];     // 队列
    private enqueued = new Set<string>();
    private processing = false;
    private db: Database

    constructor() {
        this.db = getDatabase()
    }

    /**
     * 入队处理
     * @param path 
     * @returns 
     */
    public enqueue(path: string, fileType: FileType): Promise<string> {
        return new Promise((resolve, reject) => {
            // 去重：同一文件只入队一次
            if (this.queue.some(item => item.filePath === path)) {
                resolve(''); // 已在队列中，直接返回空字符串或可改为等待现有任务结果
                return;
            }
            this.enqueued.add(path);
            this.queue.push({ filePath: path, fileType, resolve, reject });
            this.processQueue(); // 触发处理
        });
    }

    // 处理队列
    private async processQueue() {
        if (this.processing) return;
        this.processing = true;

        try {
            // 检查队列中是否有skip_ocr=1的文件，裁剪队列
            // this.pruneQueueBySkipFlag();
            while (this.queue.length > 0) {
                const task = this.queue.shift()!;
                const { filePath, fileType, resolve, reject } = task;

                let aiResponse: { summary: string, tags: string[] } = { summary: '', tags: [] }
                let content = ''
                // 区分图片或者文档
                if (fileType === FileType.Image) {
                    // 图片处理
                    const aiResponseString = await ollamaService.generate({
                        path: filePath,
                        prompt: ImagePrompt,
                        content: `图片标题: ${filePath.split('/').pop()}`,
                        isImage: true,
                        isJson: true,
                    })
                    aiResponse = JSON.parse(aiResponseString) as { summary: string, tags: string[] }
                } else {
                    // 文档处理
                    const ext = path.extname(filePath).toLowerCase();
                    const name = path.basename(filePath).toLowerCase();
                    content = await documentSeverSingleton.readDocument(filePath, ext)
                    if (content) {
                        logger.info(`读取文档内容成功: ${name}`)
                    }
                    const aiResponseString = await ollamaService.generate({
                        path: filePath,
                        prompt: DocumentPrompt,
                        content: `全文内容: ${content}，文件标题: ${name}`,
                        isJson: true,
                    })
                    aiResponse = JSON.parse(aiResponseString)
                    logger.info(`文档分析成功: ${name}`)
                }
                this.insertResult(
                    filePath,
                    fileType === FileType.Image ? aiResponse.summary : content,
                    aiResponse.summary,
                    aiResponse.tags
                )
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'AI 队列处理失败';
            logger.error(`AI队列处理失败: ${msg}`);
            // 处理下一个
            this.processing = false;
            if (this.queue.length > 0) this.processQueue();
        } finally {
            this.processing = false;
        }
    }

    // 入库操作
    private insertResult = (documentPath: string, content: string, summary: string, tags: string[]) => {
        try {
            // 获取更多详情
            const file = fs.statSync(documentPath);
            const size = file.size;
            const modifiedAt = Math.floor(file.mtimeMs);
            const name = path.basename(documentPath).toLowerCase();
            const ext = path.extname(documentPath).toLowerCase();
            // 计算MD5
            const metadataString = `${documentPath}-${size}-${modifiedAt}`;
            const md5 = crypto.createHash('md5').update(metadataString).digest('hex');
            // windows 路径归一化
            const normalizedPath = normalizeWinPath(documentPath);

            const updateStmt = this.db.prepare(`UPDATE files SET md5 = ?, size = ?, modified_at = ?,full_content = ?,summary = ?,tags = ?,ai_mark=1 WHERE path = ?`);
            const res = updateStmt.run(md5, size, modifiedAt, content, summary, tags.join(','), normalizedPath);
            if (res.changes > 0) {
                logger.info(`文档读取成功: ${normalizedPath}`);;
                return true;
            }
            // 没有记录，则插入一条新的记录
            const insertStmt = this.db.prepare(
                `INSERT OR IGNORE INTO files (md5, path, name, ext, full_content,summary,tags, size, modified_at, ai_mark=1)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );

            const inserRes = insertStmt.run(md5, normalizedPath, name, ext, content, summary, tags.join(','), size, modifiedAt);
            if (inserRes.changes > 0) {
                logger.info(`AI 标记成功: ${normalizedPath}`);
                return true;
            }
            throw new Error(`AI 标记失败: ${normalizedPath}`);
        } catch (error) {
            logger.error(`insertResult222处理失败: ${error}`);
        }
    }
}

// 导出单例
export const aiSeverSingleton = new AiSever()