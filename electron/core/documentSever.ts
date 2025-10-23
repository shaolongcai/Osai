import * as path from 'path';
import { logger } from '../core/logger.js';
import { INotification } from '../types/system.js';
import { getDatabase } from '../database/sqlite.js';
import { Database } from 'better-sqlite3';
import { sendToRenderer } from '../main.js';
import { fileURLToPath } from 'url';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { ollamaService } from './ollama.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * 文档服务：读取文档、摘要文档、标签化文档
 */
export class DocumentSever {

    private pendingDocuments: Map<string, { resolve: Function; reject: Function }>
    private db: Database


    constructor() {
        this.pendingDocuments = new Map()
        this.db = getDatabase()
    }


    // 读取文档
    public readDocument = async (ext: string, documentPath: string): Promise<void> => {
        switch (ext) {
            case '.pdf':
                const loader = new PDFLoader(documentPath)
                const docs = await loader.load()
                const content = docs.map(doc => doc.pageContent).join('\n')
                logger.info(`读取文档成功: ${documentPath.split('/').pop()}`)
                const resultString = await ollamaService.generate({
                    path: documentPath,
                    prompt: '根据全文内容与文件标题，输出中文摘要以及若干个中文标签，标签数量限制在5~7个，摘要控制在300字以内,不要重复内容。',
                    content: `全文内容: ${content}，文件标题: ${documentPath.split('/').pop().replace('.pdf', '')}`,
                    isJson: true,
                })
                const result = JSON.parse(resultString)
                logger.info(`文档分析成功: ${result.summary}`)

                // 数据库操作
                const updateStmt = this.db.prepare(`UPDATE files SET summary = ?, tags = ?, ai_mark = 1, skip_ocr = 1 WHERE path = ?`);
                const res = updateStmt.run(result.summary, JSON.stringify(result.tags), documentPath);
                logger.info(`数据库更新成功: ${res.changes}`)

                if (res.changes > 0) {
                    logger.info(`AI Mark 文档更新成功`);
                    const notification: INotification = {
                        id: 'ai-mark',
                        text: `AI 正在记录文档... 剩余 ${this.pendingDocuments.size}`,
                        type: 'loading',
                        // tooltip: ''
                    }
                    sendToRenderer('system-info', notification)
                    this.handleFinishDocumentProcessed(documentPath)
                }

            default:
                break;
        }
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
}