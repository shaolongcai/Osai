import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Database from 'better-sqlite3'
import dayjs from 'dayjs'
import type { IndexFile } from '../types/database';

// --- 这个文件中的所有代码都将在工作线程中运行 ---

// 从主文件复制过来的 ALLOWED_EXTENSIONS
const ALLOWED_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.ppt', '.pptx', '.csv',
    '.doc', '.docx', '.txt', '.xlsx', '.xls', '.pdf'
]);


// 任何包含这些字符串的路径都将被忽略。
// 注意：这里使用小写进行匹配，以确保跨平台和大小写不敏感的兼容性。
const ignorePatterns = [
    '$recycle.bin', // Windows 回收站
    'system volume information', // Windows 系统卷信息
    'app.asar',     // Electron ASAR 归档文件
    'node_modules', // 通常不需要索引的依赖文件夹
    '.git',         // Git 版本控制文件夹
    '.vscode',      // VSCode 配置文件夹
    '.idea',        // IntelliJ IDEA 配置文件夹
    'temp',         // 临时文件或文件夹
    'tmp',          // 临时文件或文件夹
    'cache',        // 缓存文件夹
    'logs',         // 日志文件夹
    'build',        // 构建输出文件夹
    'dist',         // 分发输出文件夹
    'out',          // 输出文件夹
    'target',       // Java/Maven 等构建输出
    '__pycache__',  // Python 缓存
    '.DS_Store',    // macOS 文件
    'thumbs.db',    // Windows 缩略图缓存
    'desktop.ini',  // Windows 系统文件
];


const BATCH_SIZE = 5000 // 每 50 个文件报告一次进度

// --- 1. 首先，获取 workerData 并初始化数据库 ---
const { drive, dbPath, excludedDirNames } = workerData as { drive: string; dbPath: string; excludedDirNames: string[] };
const db = new Database(dbPath);
const excludedDirNamesSet = new Set(excludedDirNames); // 将目录名数组转回 Set 以提高查找效率
db.pragma('journal_mode = WAL'); // 开启 WAL 模式以提高并发性能

// --- 2. 其次，准备好所有需要用到的 SQL 语句 ---
const selectStmt = db.prepare('SELECT size, modified_at FROM files WHERE path = ?');
const updateStmt = db.prepare(
    'UPDATE files SET md5 = ?, size = ?, modified_at = ? WHERE path = ?'
);
const insertStmt = db.prepare(
    'INSERT INTO files (md5, path, name, ext, size, created_at, modified_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

// 从主文件复制过来的 findFiles 函数
function findFiles(dir: string): string[] {

    // 如果目录名本身在被排除的名称列表中，则跳过
    const baseName = path.basename(dir);
    if (excludedDirNamesSet.has(baseName)) {
        return [];
    }

    // 添加回收站路径检查
    // if (dir.includes('$RECYCLE.BIN') || dir.includes('System Volume Information')) {
    //     return [];
    // }

    // 检查忽略路径
    if (ignorePatterns.some(pattern => dir.toLowerCase().includes(pattern))) {
        return [];
    }

    let results: string[] = [];
    let fileCount = 0
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(findFiles(filePath));
                } else {
                    const ext = path.extname(filePath).toLowerCase();
                    //如果文件的前面路径为C:\Users\Administrator\Downloads，则打印

                    if (ALLOWED_EXTENSIONS.has(ext)) {
                        fileCount++
                        results.push(filePath);

                        // 1. 快照对比：基于路径查找现有记录
                        const existingFile = selectStmt.get(filePath) as IndexFile;
                        if (existingFile) {
                            // 2. 如果记录存在，检查元数据是否变化
                            const existingMtime = new Date(existingFile.modified_at).getTime();

                            if (existingFile.size !== stat.size || existingMtime !== stat.mtime.getTime()) {
                                // 累计新增
                                // 文件已修改，更新记录（包括新的MD5）
                                const metadataString = `${filePath}-${stat.size}-${stat.mtime.getTime()}`;
                                const md5 = crypto.createHash('md5').update(metadataString).digest('hex');
                                updateStmt.run(md5, stat.size, dayjs(stat.mtime).format(), filePath);
                            }
                            // 如果 size 和 mtime 都没变，说明文件未更改，我们什么都不做
                        } else {
                            // 3. 如果记录不存在，这是新文件，插入新记录，注意：名称更改，则path也会更改
                            const metadataString = `${filePath}-${stat.size}-${stat.mtime.getTime()}`;
                            const md5 = crypto.createHash('md5').update(metadataString).digest('hex');
                            insertStmt.run(md5, filePath, file, ext, stat.size, dayjs(stat.ctime).format(), dayjs(stat.mtime).format());
                        }
                    }
                }
            } catch (error) {
                // 忽略无法访问的文件
                // console.error('无法访问的文件:', error);
            }
        });
    } catch (error) {
        // 忽略无法读取的目录
        // console.error('无法读取的目录:', error);
    }
    return results;
}


// --- 工作线程入口点 ---
try {
    const files = findFiles(drive + '\\');
    parentPort?.postMessage({ status: 'success', files });
} catch (error) {
    const msg = error instanceof Error ? error.message : '索引失败';
    // parentPort?.postMessage({ status: 'error', error: msg });
}
