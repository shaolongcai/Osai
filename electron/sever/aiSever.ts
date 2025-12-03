import * as path from 'path';
import * as fs from 'fs';
import { Database } from 'better-sqlite3';
import { getDatabase } from '../database/sqlite.js';
import { FileType } from '../units/enum.js';
import { ollamaService } from './ollamaSever.js';
import { ImagePrompt, DocumentPrompt } from '../data/prompt.js';
import { logger } from '../core/logger.js';
import { documentSeverSingleton } from './documentSever.js';
import { INotification2 } from '../types/system.js';
import { sendToRenderer } from '../main.js';
import { calculateMd5 } from '../units/math.js';
import { checkTask } from '../database/repositories.js';

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
            // 开始处理发送消息
            this.sendNotification('start')
            while (this.queue.length > 0) {
                try {
                    const task = this.queue.shift()!;
                    const { filePath, fileType, resolve, reject } = task;

                    // 检查task，是否在数据库已被处理
                    const isProcessed = checkTask(filePath, 'ai')
                    if (isProcessed) {
                        // resolve(''); // 已在数据库中处理，直接返回空字符串或可改为等待现有任务结果
                        continue;
                    }

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
                } catch (error) {
                    const msg = error instanceof Error ? error.message : 'AI项目 处理失败';
                    logger.error(`AI项目失败: ${msg}`);
                    continue;
                }
                finally {
                    // 处理单个完成，发送消息
                    this.sendNotification('pending')
                }
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'AI 队列处理失败';
            logger.error(`AI队列处理失败: ${msg}`);
        } finally {
            this.processing = false;
            // 全部完成，发送消息
            this.sendNotification('success')
        }
    }

    // 检查任务是否已经处理
    // private checkTask(filePath: string) {
    //     const checkStmt = this.db.prepare(`SELECT ai_mark,md5,path,size,modified_at FROM files WHERE path = ?`);
    //     const row = checkStmt.get(filePath) as { ai_mark: number, md5: string, path: string, size: number, modified_at: number } | undefined;
    //     if (row?.ai_mark) {
    //         const state = fs.statSync(filePath)
    //         // 计算文件的md5
    //         const newMd5 = calculateMd5(filePath, state.size, Math.floor(state.mtimeMs))
    //         // console.log('新的md5', newMd5)
    //         // console.log('旧的md5', row.md5)
    //         // console.log('新的size', state.size)
    //         // console.log('旧的size', row.size)
    //         // console.log('新的modified_at', Math.floor(state.mtimeMs))
    //         // console.log('旧的modified_at', row.modified_at)
    //         // console.log('新的path', filePath)
    //         // console.log('旧的path', row.path)
    //         if (newMd5 === row.md5) {
    //             logger.info(`文件 ${filePath} 已被处理`)
    //             return true;
    //         }
    //     }
    //     return false
    // }

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
            const md5 = calculateMd5(documentPath, size, modifiedAt);
            // 已经AI处理过的，不再需要OCR
            const updateStmt = this.db.prepare(`UPDATE files SET 
                md5 = ?, size = ?, modified_at = ?,
                full_content = ?,summary = ?,tags = ?,
                ai_mark=1,
                skip_ocr=1
                WHERE path = ?`
            );
            const res = updateStmt.run(md5, size, modifiedAt, content, summary, tags.join(','), documentPath);
            if (res.changes > 0) {
                logger.info(`文档更新成功: ${documentPath}`);;
                return true;
            }
            // 没有记录，则插入一条新的记录
            const insertStmt = this.db.prepare(
                `INSERT OR IGNORE INTO files (md5, path, name, ext, full_content,summary,tags, size, modified_at, ai_mark=1,skip_ocr=1)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );

            const inserRes = insertStmt.run(md5, documentPath, name, ext, content, summary, tags.join(','), size, modifiedAt);
            if (inserRes.changes > 0) {
                logger.info(`AI 标记成功: ${documentPath}`);
                return true;
            }
            throw new Error(`AI 标记失败: ${documentPath}`);
        } catch (error) {
            logger.error(`insertResult222处理失败: ${error}`);
        }
    }

    // 发送消息
    private sendNotification = (type: 'success' | 'pending' | 'start') => {
        const text = type === 'success' ? 'AI索引已完成' : type === 'pending' ? `AI索引中 剩余 ${this.queue.length}` : 'AI索引中'
        const notification: INotification2 = {
            id: 'aiMark',
            text: text,
            textType: type === 'success' ? 'aiMarkSuccess' : type === 'pending' ? 'aiMarkPending' : 'aiMarkStart',
            count: this.queue.length,
            type: type === 'success' ? 'success' : 'pending',
            tooltip: type === 'success' ? '' : 'AI索引中,可能GPU或CPU的占用率会升高'
        }
        sendToRenderer('system-info', notification)
    }
}

// 导出单例
export const aiSeverSingleton = new AiSever()