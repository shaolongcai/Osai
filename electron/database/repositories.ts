/**
 * 数据访问层
 */
import * as fs from 'fs'
import { getDatabase } from './sqlite.js'
import { calculateMd5 } from '../units/math.js';
import { logger } from '../core/logger.js';

const db = getDatabase()
/**
 * 检查文件是否已被处理
 * @param filePath 文件路径
 * @param type 检查类型
 * @returns 如果文件已被处理则返回true，否则返回false
 */
export const checkTask = (filePath: string, type: 'ai' | 'ocr' | 'document') => {
    const checkStmt = db.prepare(`SELECT ai_mark,md5,path,size,modified_at,full_content,skip_ocr FROM files WHERE path = ?`);
    const row = checkStmt.get(filePath) as { ai_mark: number, md5: string, path: string, size: number, modified_at: number, full_content: string, skip_ocr: number } | undefined;
    const state = fs.statSync(filePath)
    // 检查文件是否存在
    if (!state) {
        logger.error(`文件 ${filePath} 不存在`)
        return false
    }
    // 计算文件的md5
    const newMd5 = calculateMd5(filePath, state.size, Math.floor(state.mtimeMs))
    switch (type) {
        case 'ai':
            if (!row?.ai_mark) return false
            break
        case 'ocr':
            if (!row?.skip_ocr) return false
            break
        case 'document':
            if (!row?.full_content) return false
            break
    }
    // console.log('新的md5', newMd5)
    // console.log('旧的md5', row.md5)
    // console.log('新的size', state.size)
    // console.log('旧的size', row.size)
    // console.log('新的modified_at', Math.floor(state.mtimeMs))
    // console.log('旧的modified_at', row.modified_at)
    // console.log('新的path', filePath)
    // console.log('旧的path', row.path)
    if (newMd5 === row.md5) {
        logger.info(`文件 ${filePath} 已被处理`)
    }
    // 最后比较md5是否有变化
    return Boolean(newMd5 === row.md5)
}