import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Database from 'better-sqlite3';
import dayjs from 'dayjs';
import fg from 'fast-glob';
import type { IndexFile } from '../types/database';

// ... (ALLOWED_EXTENSIONS and BATCH_SIZE remain the same)
const ALLOWED_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.ppt', '.pptx', '.csv',
    '.doc', '.docx', '.txt', '.xlsx', '.xls', '.pdf'
]);
const BATCH_SIZE = 10000;

// --- 1. 首先，获取 workerData 并初始化数据库 ---
const { drive, dbPath, excludedDirNames } = workerData as {
    drive: string;
    dbPath: string;
    excludedDirNames: string[];
};
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// --- 2. 其次，准备好所有需要用到的 SQL 语句 ---
const selectStmt = db.prepare('SELECT size, modified_at FROM files WHERE path = ?');
const updateStmt = db.prepare(
    'UPDATE files SET md5 = ?, size = ?, modified_at = ? WHERE path = ?'
);
const insertStmt = db.prepare(
    'INSERT INTO files (md5, path, name, ext, size, created_at, modified_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

async function findFiles(dir: string): Promise<string[]> {
    try {
        console.log(`🚀 使用 fast-glob 在 "${dir}" 中开始异步搜索...`);

        // const patterns = Array.from(ALLOWED_EXTENSIONS).map(ext => `**/*${ext}`);
        const dynamicIgnores = excludedDirNames.map(d => `**/${d}/**`);

        const ignorePatterns = [
            ...dynamicIgnores,
            '**/.?*',
            '**/{node_modules,.$*,System Volume Information,AppData,ProgramData,Program Files,Program Files (x86),Windows,.git,.vscode,.idea,temp,tmp,cache,logs,build,dist,out,target,__pycache__}/**',
            '**/*.{asar,DS_Store,thumbs.db,desktop.ini}',
            '**/.Trash/**'
        ];

        const stream = fg.stream('/**/*.{png,jpg,jpeg,ppt,pptx,csv,doc,docx,txt,xlsx,xls,pdf}', {
            cwd: drive,
            ignore: ignorePatterns,
            onlyFiles: true,
            dot: true,
            caseSensitiveMatch: false,
            suppressErrors: true, //跳过出错的文件
            // stats: true, // 请求返回 stat 对象
            absolute: true, // 返回绝对路径
            throwErrorOnBrokenSymbolicLink: false
        });

        const allFiles: string[] = [];
        let processedCount = 0;

        //📌 stat加上后，无法返回实体
        for await (const filePath of stream) {
            // console.log('filePath', filePath)
            // const filePath = (entry as any).path;
            // const stats = (entry as any).stats;
            const stat = fs.statSync(filePath);
            // if (!stat) continue;

            allFiles.push(filePath as string);
            processFile(filePath as string, stat);
            processedCount++;

            if (processedCount % BATCH_SIZE === 0) {
                // parentPort?.postMessage({
                //     type: 'progress',
                //     content: `已处理 ${processedCount} 个文件...`
                // });
            }
        }

        console.log(`✅ fast-glob 搜索完成，共找到 ${allFiles.length} 个文件。`);
        return allFiles;
    } catch (error) {
        console.error(error)
        return []
    }
}

function processFile(filePath: string, stat: fs.Stats) {
    try {
        const file = path.basename(filePath).toLowerCase();
        const ext = path.extname(filePath).toLowerCase();

        const existingFile = selectStmt.get(filePath) as IndexFile | undefined;

        if (existingFile) {
            const existingMtime = new Date(existingFile.modified_at).getTime();
            // 文件已修改，则更新记录（包括新的MD5）
            if (existingFile.size !== stat.size || existingMtime !== stat.mtime.getTime()) {
                const metadataString = `${filePath}-${stat.size}-${stat.mtime.getTime()}`;
                const md5 = crypto.createHash('md5').update(metadataString).digest('hex');
                updateStmt.run(md5, stat.size, dayjs(stat.mtime).format(), filePath);

                //@todo: AI mark功能 重新摘要（放到线程）
            }
        } else {
            const metadataString = `${filePath}-${stat.size}-${stat.mtime.getTime()}`;
            const md5 = crypto.createHash('md5').update(metadataString).digest('hex');
            insertStmt.run(md5, filePath, file, ext, stat.size, dayjs(stat.ctime).format(), dayjs(stat.mtime).format());
        }
    } catch (error) {
        console.error(error)
        throw error
    }
}

// --- 工作线程入口点 ---
(async () => {
    try {
        const files = await findFiles(path.join(drive));
        parentPort?.postMessage({ status: 'success', files });
    } catch (error) {
        const msg = error instanceof Error ? error.message : '索引失败';
        console.error(`❌ 索引失败: ${msg}`);
        parentPort?.postMessage({ status: 'error', error: msg });
    }
})();