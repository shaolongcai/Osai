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
import * as fsAsync from 'fs/promises';
import * as fs from 'fs';
import XLSX from 'xlsx';
import { calculateMd5 } from '../units/math.js';
import { checkTask } from '../database/repositories.js';

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

            while (this.queue.length > 0) {
                const task = this.queue.shift()!;
                const { documentPath, resolve, reject } = task;

                // 检查是否已经读取了全文
                const isProcessed = checkTask(documentPath, 'document')
                if (isProcessed) {
                    resolve(''); // 已在数据库中处理，直接返回空字符串或可改为等待现有任务结果
                    continue;
                }

                try {
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
                    const content = await this.readDocument(documentPath, ext);
                    const success = this.insertResult(documentPath, content);
                    resolve(content);
                } catch (error) {
                    const msg = error instanceof Error ? error.message : '图片处理失败';
                    // logger.warn(`OCR 服务处理失败: ${msg} ${imagePath}`);
                } finally {
                    // 出列与去重清理
                    this.enqueued.delete(documentPath);
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
            const file = fs.statSync(documentPath);
            const size = file.size;
            const modifiedAt = Math.floor(file.mtimeMs);
            const name = path.basename(documentPath).toLowerCase();
            const ext = path.extname(documentPath).toLowerCase();
            const md5 = calculateMd5(documentPath, size, modifiedAt);

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
            const res = upsertStmt.run(md5, documentPath, name, ext, content, size, modifiedAt);
            logger.info(`文档索引成功: ${documentPath} (changes=${res.changes})`);
            return true;
        } catch (error) {
            logger.error(`insertResult处理失败: ${error}`);
            return false;
        }
    }

    /**
     * 读取文档内容
     * @param ext 文档扩展名
     * @param documentPath 文档路径
     * @returns 文档内容 string
     */
    public readDocument = async (documentPath: string, ext: string): Promise<string> => {
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
