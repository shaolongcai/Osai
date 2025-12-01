import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Database from 'better-sqlite3';
import dayjs from 'dayjs';
import fg from 'fast-glob';
import type { IndexFile } from '../types/database';

/**
 * 基础的文件信息
 */
type FileInfo = {
    filePath: string;
    name: string;
    ext: string;
};


const ALLOWED_EXTENSIONS = 'png,jpg,jpeg,ppt,pptx,csv,doc,docx,txt,xlsx,xls,pdf'
const BATCH_SIZE = 10000;

// --- 1. 首先，获取 workerData 并初始化数据库 ---
const { drive, dbPath } = workerData as {
    drive: string;
    dbPath: string;
};
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// --- 准备好 SQL 语句 ---
const insertStmt = db.prepare(
    'INSERT OR IGNORE INTO files (md5, path, name, ext) VALUES (?, ?, ?, ?)'
);


async function findFiles(dir: string): Promise<FileInfo[]> {
    try {
        console.log(`🚀 使用 fast-glob 在 "${dir}" 中开始异步搜索...`);

        const ignorePatterns = [
            '**/.?*',
            '**/{node_modules,.$*,System Volume Information,AppData,ProgramData,Program Files,Program Files (x86),Windows,.git,.vscode,.idea,temp,tmp,cache,logs,build,dist,out,target,__pycache__}/**',
            '**/*.{asar,DS_Store,thumbs.db,desktop.ini}',
            '**/.Trash/**',
            '**/Library/**', // mac忽略目录
            '**/.*/**', // 去掉所有以点开头的文件夹
            '**/*.app/**', // 去掉所有以.app结尾的文件夹
            '**/Applications/**', //去掉应用程序，在应用程序中已经寻找了
        ];

        const fileInfoList: Array<FileInfo> = [];
        let processedCount = 0;
        // 📌 注意：win本来为 /**/*.{${ALLOWED_EXTENSIONS}}
        const scanPaht = process.platform === 'win32' ? `/**/*.{${ALLOWED_EXTENSIONS}}` : `**/*.{${ALLOWED_EXTENSIONS}}`;
        const stream = fg.stream(scanPaht, {
            cwd: drive,
            ignore: ignorePatterns,
            onlyFiles: true,
            dot: true,
            caseSensitiveMatch: false,
            suppressErrors: true, //跳过出错的文件
            absolute: true, // 返回绝对路径
            throwErrorOnBrokenSymbolicLink: false,
            // deep: 5 
        });

        // 收集所有文件信息
        for await (const filePath of stream) {
            try {
                //根据path，取出name以及ext
                const name = path.basename(filePath as string);
                const ext = path.extname(filePath as string);
                fileInfoList.push({ filePath: filePath as string, name, ext });
            } catch (error) {
                console.error(`读取文件 ${filePath} 信息时出错:`, error);
            }
        }

        console.log('📁 搜索文件夹中...');
        const dirStream = fg.stream('**/', {
            cwd: drive,
            ignore: ignorePatterns,
            onlyDirectories: true,
            dot: false,
            caseSensitiveMatch: false,
            suppressErrors: true,
            absolute: true,
            // 限制文件夹深度，避免搜索过深
            // deep: 5
        });

        for await (const dirPath of dirStream) {
            try {
                const name = path.basename(dirPath as string);
                const ext = path.extname(dirPath as string);
                fileInfoList.push({ filePath: dirPath as string, name, ext });
                processedCount++;

                if (processedCount % BATCH_SIZE === 0) {
                    parentPort?.postMessage({
                        type: 'progress',
                        content: `已扫描 ${processedCount} 个项目...`
                    });
                }
            } catch (error) {
                console.error(`处理文件夹 ${dirPath} 时出错:`, error);
            }
        }

        console.log(`🔄 开始批量更新数据库...`);

        // 批量处理所有文件并更新数据库
        batchProcessFiles(fileInfoList);

        console.log(`✅ 数据库更新完成。`);
        return fileInfoList;
    } catch (error) {
        console.error(error)
        return []
    }
}


/**
 * 批量处理文件并更新数据库（使用事务提升性能）
 * @param fileInfoList 文件信息列表
 */
function batchProcessFiles(fileInfoList: Array<FileInfo>) {
    try {
        // 使用事务批量处理，大幅提升性能
        const transaction = db.transaction((files: Array<FileInfo>) => {
            let insertCount = 0;

            for (const { filePath, name, ext } of files) {
                try {
                    const fileName = name.toLowerCase();
                    const extLower = ext.toLowerCase();
                    // 计算MD5的方法
                    // const metadataString = `${filePath}-${stat.size}-${stat.mtime.getTime()}`;
                    // const md5 = crypto.createHash('md5').update(metadataString).digest('hex');
                    insertStmt.run(filePath, filePath, fileName, extLower); //临时使用filePaht代替MD5
                    insertCount++;
                } catch (error) {
                    console.error(`处理文件 ${filePath} 时出错:`, error);
                }
            }

            console.log(`📊 数据库操作统计: 总共 ${insertCount} 条`);
        });

        // 执行事务
        transaction(fileInfoList);
    } catch (error) {
        console.error('批量处理文件时出错:', error);
        throw error;
    }
}

// --- 工作线程入口点 ---
(async () => {
    try {
        const files = await findFiles(path.join(drive));

        // 1. 先发送成功消息
        parentPort?.postMessage({ status: 'success', files });

        // 2. 关闭数据库连接
        db.close();

        // 3. 正常退出
        process.exit(0);

    } catch (error) {
        const msg = error instanceof Error ? error.message : '索引失败';
        console.error(`❌ 索引失败: ${msg}`);

        // 1. 先发送错误消息
        parentPort?.postMessage({ status: 'error', error: msg });

        // 2. 关闭数据库连接
        try {
            db.close();
        } catch (e) {
            console.error('关闭数据库失败:', e);
        }

        // 3. 异常退出
        process.exit(1);
    }
})();