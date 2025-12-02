import * as path from 'path';
import { logger } from '../core/logger.js';
import { INotification, INotification2 } from '../types/system.js';
import { getDatabase } from '../database/sqlite.js';
import { Database } from 'better-sqlite3';
import { sendToRenderer } from '../main.js';
import { fileURLToPath } from 'url';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { ollamaService } from '../core/ollama.js';
import * as fsAsync from 'fs/promises';
import * as fs from 'fs';
import XLSX from 'xlsx';
import * as crypto from 'crypto';
import { normalizeWinPath } from '../units/pathUtils.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * 文档服务：读取文档、摘要文档、标签化文档
 */
class DocumentSever {

    private pendingDocuments: Map<string, { resolve: Function; reject: Function }>
    private queue: { documentPath: string, resolve: Function; reject: Function }[] = [];     // 队列
    private enqueued = new Set<string>();
    private processing = false;
    private db: Database

    constructor() {
        this.pendingDocuments = new Map()
        this.db = getDatabase()
    }

    // 统一入口，入队并返回识别结果
    public enqueue(documentPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // 去重：同一文件只入队一次
            if (this.queue.some(item => item.documentPath === documentPath)) {
                resolve(''); // 已在队列中，直接返回空字符串或可改为等待现有任务结果
                return;
            }
            this.enqueued.add(documentPath);
            this.queue.push({ documentPath, resolve, reject });
            this.processQueue(); // 触发处理
        });
    }


    // 2、队列处理（串行）
    private async processQueue() {
        if (this.processing) return;
        this.processing = true;

        try {

            // 检查队列中是否有skip_ocr=1的文件，裁剪队列
            // this.pruneQueueBySkipFlag();

            while (this.queue.length > 0) {
                const task = this.queue.shift()!;
                const { documentPath, resolve, reject } = task;

                try {
                    if (!fs.existsSync(documentPath)) {
                        throw new Error(`文档服务处理跳过: 文件不存在 ${documentPath}`);
                    }
                    // UI提示剩余任务
                    // const notification: INotification2 = {
                    //     id: 'ocr',
                    //     text: `OCR 服务已启动 剩余 ${this.queue.length}`,
                    //     textType: 'ocrSever',
                    //     count: this.queue.length,
                    //     type: 'loadingQuestion',
                    //     tooltip: 'OCR 服务：识别图片中的文字，便于搜索图片内容。可前往【设置】关闭'
                    // }
                    // sendToRenderer('system-info', notification)

                    const ext = path.extname(documentPath).toLowerCase();
                    const content = await this.readDocument(ext, documentPath);
                    const success = this.insertResult(documentPath, content);
                    resolve(content);
                } catch (error) {
                    const msg = error instanceof Error ? error.message : '图片处理失败';
                    // logger.warn(`OCR 服务处理失败: ${msg} ${imagePath}`);
                } finally {
                    // 出列与去重清理
                    this.enqueued.delete(documentPath);
                    if (this.enqueued.size === 0) {
                        const notification: INotification2 = {
                            id: 'ocr',
                            text: `OCR任务已完成`,
                            type: 'success',
                            textType: 'ocrSuccess',
                        }
                        // sendToRenderer('system-info', notification)
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

    // 入库操作
    private insertResult = (documentPath: string, content: string) => {
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
            const updateStmt = this.db.prepare(`UPDATE files SET md5 = ?, size = ?, modified_at = ?,full_content = ? WHERE path = ?`);
            const res = updateStmt.run(md5, size, modifiedAt, content, normalizedPath);
            if (res.changes > 0) {
                logger.info(`文档读取成功: ${normalizedPath}`);;
                return true;
            }
            // 没有记录，则插入一条新的记录
            const insertStmt = this.db.prepare(
                `INSERT OR IGNORE INTO files (md5, path, name, ext, full_content, size, modified_at, skip_ocr)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
            );

            const inserRes = insertStmt.run(md5, normalizedPath, name, ext, content, size, modifiedAt);
            if (inserRes.changes > 0) {
                logger.info(`OCR 索引插入成功: ${normalizedPath}`);
                return true;
            }
            throw new Error(`OCR 索引插入失败: ${normalizedPath}`);
        } catch (error) {
            logger.error(`insertResult处理失败: ${error}`);
        }
    }

    // 读取文档
    private readDocument = async (ext: string, documentPath: string): Promise<string> => {
        let content: string //文档全文
        switch (ext) {
            case '.pdf':
                const loader = new PDFLoader(documentPath)
                const docs = await loader.load()
                content = docs.map(doc => doc.pageContent).join('\n')
                break;
            case '.doc':
            case '.docx':
                const loaderDocx = new DocxLoader(documentPath, {
                    type: ext.replace('.', '') as "docx" | "doc",
                })
                const docsDocx = await loaderDocx.load()
                content = docsDocx.map(doc => doc.pageContent).join('\n')
                break;
            case '.txt':
                content = await fsAsync.readFile(documentPath, 'utf8');
                break;
            case '.csv':
                content = await fsAsync.readFile(documentPath, 'utf8');
                break;
            case '.xls':
            case '.xlsx':
                content = await this.readExcelFile(documentPath);
                break;
            case '.ppt':
            case '.pptx':
                const loaderPPTX = new PPTXLoader(documentPath);
                const docsPPTX = await loaderPPTX.load()
                content = docsPPTX.map(doc => doc.pageContent).join('\n')
                break;
            default:
                break;
        }

        return content

        // 执行AI操作
        // logger.info(`读取文档成功: ${documentPath.split('/').pop()}`)
        // const resultString = await ollamaService.generate({
        //     path: documentPath,
        //     prompt: DocumentPrompt,
        //     content: `全文内容: ${content}，文件标题: ${documentPath.split('/').pop()}`,
        //     isJson: true,
        // })
        // const result = JSON.parse(resultString)
        // // console.log('简介:', result.summary)
        // // console.log('标签:', result.tags)
        // logger.info(`文档分析成功`)

        // 数据库操作
        // const updateStmt = this.db.prepare(`UPDATE files SET summary = ?, tags = ?, ai_mark = 1, skip_ocr = 1 WHERE path = ?`);
        // const res = updateStmt.run(result.summary, JSON.stringify(result.tags), documentPath);
        // logger.info(`数据库更新成功: ${res.changes}`)
    };


    // 处理完成的文档，发送消息
    private handleFinishDocumentProcessed = (documentPath: string) => {
        this.pendingDocuments.delete(documentPath);
        if (this.pendingDocuments.size === 0) {
            const notification: INotification = {
                id: 'ai-mark',
                text: `AI Mark已完成`,
                type: 'success',
                // tooltip: ''
            }
            sendToRenderer('system-info', notification)
        }
    }


    // 读取 Excel 文件的函数
    private async readExcelFile(filePath: string): Promise<string> {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetNames = workbook.SheetNames;
            let content = '';

            // 遍历所有工作表
            sheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                content += `=== 工作表: ${sheetName} ===\n`;
                jsonData.forEach((row: any[]) => {
                    content += row.join('\t') + '\n';
                });
                content += '\n';
            });

            return content;
        } catch (error) {
            const msg = error instanceof Error ? error.message : '读取Excel文件失败';
            logger.warn(`读取Excel文件时出错: ${msg}`);
            throw new Error(msg);
        }
    }
}

// 导出单例
export const documentSeverSingleton = new DocumentSever()
