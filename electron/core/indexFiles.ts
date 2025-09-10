import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import pathConfig from './pathConfigs.js';
import { getDatabase } from '../database/sqlite.js';
import { vectorFiles } from './vectorization.js';

// 获取当前文件路径（ES模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义允许的文件扩展名
const ALLOWED_EXTENSIONS = new Set([
    '.png', '.jpg', '.jpeg', '.ppt', '.pptx',
    '.doc', '.docx', '.txt', '.xlsx', '.xls', '.pdf'
]);


/**
 * 递归地在一个目录中查找具有允许扩展名的文件。
 * @param dir 要开始搜索的目录。
 * @returns 文件路径列表。
 */
export function findFiles(dir: string): string[] {
    console.log('开始寻找')
    let results: string[] = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            console.log('路径', filePath)
            try {
                const stat = fs.statSync(filePath);
                if (stat && stat.isDirectory()) {
                    // 如果是目录，则递归搜索
                    results = results.concat(findFiles(filePath));
                } else {
                    // 如果是文件，检查扩展名
                    const ext = path.extname(filePath).toLowerCase();

                    if (ALLOWED_EXTENSIONS.has(ext)) {
                        //获取元数据
                        // const metadata = getFileMetadata(filePath);
                        results.push(filePath);
                    }
                }
            } catch (error) {
                console.log('无法访问的文件', error)
                // 忽略无法访问的文件或目录
            }
        });
    } catch (error) {
        // 忽略无法读取的目录（例如，由于权限问题）
        console.log('无法读取的目录', error)
    }
    return results;
}

/**
 * 获取 Windows 系统上的所有逻辑驱动器。
 * @returns 驱动器号列表 (例如, ['C:', 'D:'])。
 */
function getDrives(): string[] {
    try {
        // 使用 wmic 命令获取驱动器列表
        const output = execSync('wmic logicaldisk get name').toString();
        const drives = output.split('\r\n')
            .map(line => line.trim())
            .filter(line => /^[A-Z]:$/.test(line));
        console.log('发现的驱动器列表', drives)
        return drives;
    } catch (error) {
        console.error("无法获取驱动器列表:", error);
        return [];
    }
}


// 删除在数据库中多余
const deleteExtraFiles = async (allFiles: string[]) => {
    const db = getDatabase()
    const allFilesSet = new Set(allFiles);
    const selectStmt = db.prepare('SELECT path FROM files');
    const filesInDb = selectStmt.all() as { path: string }[];
    const filesToDelete = filesInDb.filter((file) => !allFilesSet.has(file.path));
    if (filesToDelete.length > 0) {
        console.log(`发现 ${filesToDelete.length} 个需要删除的记录。`);
        // 4. 准备删除语句并开启一个事务来批量删除
        const deleteStmt = db.prepare('DELETE FROM files WHERE path = ?');
        const deleteTransaction = db.transaction((files) => {
            for (const file of files) {
                deleteStmt.run(file.path);
            }
        });

        // 5. 执行事务
        deleteTransaction(filesToDelete);
        console.log('过时的文件记录已成功删除。');
    } else {
        console.log('数据库与文件系统一致，无需删除。');
    }
}

/**
 * 索引所有驱动器上具有允许扩展名的所有文件。
 * @returns 找到的所有文件的路径列表。
 */
export async function indexAllFilesWithWorkers(sendToRenderer: (channel: string, data: any) => void): Promise<string[]> {
    const startTime = Date.now();
    // const drives = getDrives();
    const drives = ['D:'] // 测试用
    console.log(`使用 Worker 线程开始并行索引 ${drives.length} 个驱动器...`);

    // 已完成索引盘数
    let completedDrives = 0;
    // 已完成索引文件数
    let completedFiles = 0;
    // 数据库路径
    const dbDirectory = pathConfig.get('database');
    const dbPath = path.join(dbDirectory, 'metaData.db')

    const promises = drives.map(drive => {
        return new Promise<string[]>((resolve, reject) => {
            // 明确指定 worker 脚本的路径
            // 我们需要指向编译后的 .js 文件
            const workerPath = path.join(__dirname, 'indexer.worker.js');

            const worker = new Worker(workerPath, {
                workerData: { drive, dbPath }
            });


            worker.on('message', (message) => {
                if (message.status === 'success') {
                    console.log(`驱动器 ${drive} 索引完成，找到 ${message.files.length} 个文件。`);
                    completedDrives++;
                    completedFiles += message.files.length;
                    const formattedTotal = completedFiles.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    sendToRenderer('index-progress', {
                        message: `驱动器 ${drive} 索引完成，找到 ${message.files.length} 个文件。`,
                        process: completedDrives === drives.length ? 'finish' : 'pending',
                        count: formattedTotal
                    })
                    resolve(message.files);
                }
                else if (message.type === 'progress') {
                    // 如果是进度消息，就通过 webContents 发送给前端
                    sendToRenderer('index-progress', { message: message.content })
                } else {
                    console.error(`驱动器 ${drive} 索引失败:`, message.error);
                    resolve([]);
                }
                worker.terminate();
            });

            worker.on('error', (error) => {
                console.error(`驱动器 ${drive} 的 Worker 发生严重错误:`, error);
                reject(error); // 直接拒绝 Promise
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    // 如果 worker 异常退出，也应该让 Promise 失败
                    reject(new Error(`驱动器 ${drive} 的 Worker 异常退出，退出码: ${code}`));
                }
            });
        });
    });

    try {
        const results = await Promise.all(promises);
        const allFiles = results.flat(); // flat方法展开二维数组

        const endTime = Date.now();
        console.log(`所有 Worker 线程索引完成。共找到 ${allFiles.length} 个文件，耗时: ${endTime - startTime} 毫秒`);

        // 删除多余的数据库记录
        await deleteExtraFiles(allFiles);

        // 对所有图片文件，都使用vl应用读取摘要

        // 对所有文件进行向量化,暂时不需要
        // const startVectorTime = Date.now();
        // await vectorFiles()
        // const endVectorTime = Date.now();
        // console.log(`所有文件向量化完成。耗时: ${endVectorTime - startVectorTime} 毫秒`);

        return allFiles;
    } catch (error) {
        console.error("一个或多个 Worker 索引任务失败。", error);
        return []; // 发生严重错误时返回空数组
    }
}


/**
 * 索引图片应用
 */
export async function indexImageFiles() {

    const db = getDatabase()
    // 使用ext字段查询图片文件（ext字段存储的是带点的扩展名）
    const files = db.prepare(
        'SELECT path FROM files WHERE ext IN (\'.jpg\', \'.png\', \'.jpeg\')'
    ).all() as Array<{ path: string }>;

    // 调用大模型，摘要图片
    for (const file of files) {
        const filePath = file.path;
        const summary = await summarizeImage(filePath);
    }
}
