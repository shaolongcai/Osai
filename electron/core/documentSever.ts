import * as path from 'path';
import { logger } from '../core/logger.js';
import { INotification } from '../types/system.js';
import { getDatabase } from '../database/sqlite.js';
import { Database } from 'better-sqlite3';
import { sendToRenderer } from '../main.js';
import { fileURLToPath } from 'url';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { ollamaService } from './ollama.js';
import * as fs from 'fs/promises';
import XLSX from 'xlsx';
import { DocumentPrompt } from '../data/prompt.js';



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
                content = await fs.readFile(documentPath, 'utf8');
                break;
            case '.csv':
                content = await fs.readFile(documentPath, 'utf8');
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

        // 执行AI操作
        logger.info(`读取文档成功: ${documentPath.split('/').pop()}`)
        const resultString = await ollamaService.generate({
            path: documentPath,
            prompt: DocumentPrompt,
            content: `全文内容: ${content}，文件标题: ${documentPath.split('/').pop()}`,
            isJson: true,
        })
        const result = JSON.parse(resultString)
        console.log('简介:', result.summary)
        console.log('标签:', result.tags)
        logger.info(`文档分析成功`)

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