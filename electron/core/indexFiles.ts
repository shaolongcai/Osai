import * as path from 'path';
import { execSync } from 'child_process';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import pathConfig from './pathConfigs.js';
import { getDatabase, setConfig } from '../database/sqlite.js';
import { setIndexUpdate, waitForIndexImage, waitForIndexUpdate } from './appState.js';
import { sendToRenderer } from '../main.js';
import { INotification } from '../types/system.js';
import { logger } from './logger.js';
import { createWorker } from 'tesseract.js';
import * as os from 'os';
import * as fs from 'fs'

// 获取当前文件路径（ES模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * 获取 Windows 系统上的所有逻辑驱动器（现代方法）
 * @returns 驆动器号列表 (例如, ['C:', 'D:'])
 */
const getDrivesByWindows = () => {
    try {
        // 使用dir命令列出所有驱动器（兼容性最好）
        const output = execSync('dir /a:d C:\\ 2>nul & for %i in (A B C D E F G H I J K L M N O P Q R S T U V W X Y Z) do @if exist %i:\\ echo %i:', {
            encoding: 'utf8',
            shell: 'cmd.exe'
        });

        const drives = output.split('\n')
            .map(line => line.trim())
            .filter(line => /^[A-Z]:$/.test(line))
            .sort();

        logger.info(`发现的驱动器列表:${drives}`);
        return drives;
    } catch (error) {
        logger.error(`无法获取驱动器列表:${JSON.stringify(error)}`);
        throw error
    }
}

/**
 * 获取mac上的驱动
 */
const getDrivesByMac = () => {
    try {
        const commonPaths = [
            os.homedir(), // 用户主目录
            // '/Applications', // macOS应用程序目录
            '/Desktop', // 如果存在
        ];

        // 过滤出实际存在的路径
        const existingPaths = commonPaths.filter(p => {
            try {
                return fs.existsSync(p);
            } catch {
                return false;
            }
        });

        logger.info(`发现的索引路径列表:${existingPaths}`);
        return existingPaths;
    } catch (error) {
        logger.error(`无法获取驱动器列表:${JSON.stringify(error)}`);
        throw error
    }
}

/**
 * 获取驱动盘，区分mac与windows
 */
function getDrives(): string[] {
    try {
        let drives: string[]
        if (os.platform() === 'win32') {
            drives = getDrivesByWindows()
        }
        else {
            drives = getDrivesByMac()
        }
        return drives;
    } catch (error) {
        logger.error(`无法获取驱动器列表:${JSON.stringify(error)}`);
        return []
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
        logger.info(`发现 ${filesToDelete.length} 个需要删除的记录。`);
        // 4. 准备删除语句并开启一个事务来批量删除
        const deleteStmt = db.prepare('DELETE FROM files WHERE path = ?');
        const deleteTransaction = db.transaction((files) => {
            for (const file of files) {
                deleteStmt.run(file.path);
            }
        });

        // 5. 执行事务
        deleteTransaction(filesToDelete);
        logger.info('过时的文件记录已成功删除。');
    } else {
        logger.info('数据库与文件系统一致，无需删除。');
    }
}

/**
 * 索引所有驱动器上具有允许扩展名的所有文件。
 * @returns 找到的所有文件的路径列表。
 */
export async function indexAllFilesWithWorkers(): Promise<string[]> {

    const startTime = Date.now();
    const drives = getDrives();
    // const drives = ['D:'] // 测试用
    logger.info(`使用 Worker 线程开始并行索引 ${drives.length} 个驱动器...`);

    // 已完成索引盘数
    let completedDrives = 0;
    // 已完成索引文件数
    let completedFiles = 0;
    // 数据库路径
    const dbDirectory = pathConfig.get('database');
    const dbPath = path.join(dbDirectory, 'metaData.db')

    // 排除的目录名
    const excludedDirNames = new Set([
        'node_modules',
        '$Recycle.Bin',
        'System Volume Information',
        'AppData',
        'ProgramData',
        'Program Files',
        'Program Files (x86)',
        'Windows',
        '.git',
        '.vscode',
        'Library' //mac忽略目录
    ]);
    // 将 Set 转换为数组以便通过 workerData 传递
    const excludedDirNamesArray = Array.from(excludedDirNames);

    const promises = drives.map(drive => {
        return new Promise<string[]>((resolve, reject) => {
            // 明确指定 worker 脚本的路径
            // 我们需要指向编译后的 .js 文件
            const workerPath = path.join(__dirname, 'indexer2.worker.js');

            const worker = new Worker(workerPath, {
                workerData: { drive, dbPath, excludedDirNames: excludedDirNamesArray }
            });


            worker.on('message', (message) => {
                if (message.status === 'success') {
                    logger.info(`驱动器 ${drive} 索引完成，找到 ${message.files.length} 个文件。`);
                    completedDrives++;
                    completedFiles += message.files.length;
                    // const formattedTotal = completedFiles.toLocaleString('en-US');
                    const formattedTotal = completedFiles.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); //加入千分位
                    logger.info(`formattedTotal:${formattedTotal}`)
                    // 加入千分位
                    sendToRenderer('index-progress', {
                        message: `已索引 ${formattedTotal} 个文件`,
                        process: completedDrives === drives.length ? 'finish' : 'pending',
                        count: formattedTotal
                    })
                    resolve(message.files);
                }
                else if (message.type === 'progress') {
                    // 如果是进度消息，就通过 webContents 发送给前端
                    sendToRenderer('index-progress', { message: message.content })
                } else {
                    logger.error(`驱动器 ${drive} 索引失败:${JSON.stringify(message.error)}`);
                    resolve([]);
                }
                worker.terminate();
            });

            worker.on('error', (error) => {
                logger.error(`驱动器 ${drive} 的 Worker 发生严重错误:${JSON.stringify(error)}`);
                reject(error); // 直接拒绝 Promise
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    // 如果 worker 异常退出，也应该让 Promise 失败
                    logger.error(`驱动器 ${drive} 的 Worker 异常退出，退出码: ${code}`);
                    reject(new Error(`驱动器 ${drive} 的 Worker 异常退出，退出码: ${code}`));
                }
            });
        });
    });

    try {

        const results = await Promise.all(promises);
        const allFiles = results.flat(); // flat方法展开二维数组

        const endTime = Date.now();
        logger.info(`所有 Worker 线程索引完成。共找到 ${allFiles.length} 个文件，耗时: ${endTime - startTime} 毫秒`);

        // 删除多余的数据库记录
        await deleteExtraFiles(allFiles);
        // 索引更新
        setIndexUpdate(true);
        // 记录索引时间，以及索引的文件数量
        setConfig('last_index_time', Date.now());
        setConfig('last_index_file_count', allFiles.length);

        return allFiles;
    } catch (error) {
        logger.error(`一个或多个 Worker 索引任务失败。${JSON.stringify(error)}`);
        return []; // 发生严重错误时返回空数组
    }
}


/**
 * OCR Worker 單例：避免重複初始化導致內存暴漲與崩潰
 */
let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getOCRWorker() {
    if (ocrWorker) return ocrWorker;

    const resourcesPath = pathConfig.get('resources');
    const cacheRoot = path.join(pathConfig.get('cache'), 'tesseract');
    // 確保緩存目錄存在
    try {
        if (!fs.existsSync(cacheRoot)) fs.mkdirSync(cacheRoot, { recursive: true });
    } catch (e) {
        logger.error(`创建 Tesseract 缓存目录失败: ${String(e)}`);
    }

    try {
        ocrWorker = await createWorker(['chi_sim', 'chi_tra', 'eng'], 1, {
            langPath: path.join(resourcesPath, 'traineddata'),
            cachePath: cacheRoot,
            gzip: true,
            // 錯誤處理：捕獲 worker 線程錯誤，避免應用直接崩潰
            errorHandler: (err: unknown) => {
                const msg = err instanceof Error ? err.message : String(err);
                logger.error(`OCR Worker 错误: ${msg}`);
            },
            logger: (m: unknown) => {
                // 只保留初始化階段的關鍵日誌，避免刷屏
                const s = typeof m === 'string' ? m : JSON.stringify(m);
                if (s.includes('initialized') || s.includes('loaded_lang_model')) {
                    logger.info(`OCR: ${s}`);
                }
            }
        });
        return ocrWorker;
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'OCR Worker 初始化失败';
        logger.error(`OCR 初始化失败: ${msg}`);
        // 降級策略：僅使用英語模型再次嘗試
        try {
            ocrWorker = await createWorker(['eng'], 1, {
                langPath: path.join(resourcesPath, 'traineddata'),
                cachePath: cacheRoot,
                gzip: true,
            });
            return ocrWorker;
        } catch (e2) {
            const m2 = e2 instanceof Error ? e2.message : String(e2);
            logger.error(`OCR 英語模型降級仍失敗: ${m2}`);
            throw new Error(msg);
        }
    }
}

async function terminateOCRWorker() {
    if (ocrWorker) {
        try {
            await ocrWorker.terminate();
        } catch (e) {
            logger.error(`OCR Worker 终止失败: ${String(e)}`);
        }
        ocrWorker = null;
    }
}

/**
 * 第一步：开启视觉索引服务
 */
export const indexImagesService = async (): Promise<void> => {
    logger.info('等待索引更新完毕')
    await waitForIndexUpdate();
    logger.info('索引更新完毕')

    // 尝试提前初始化 OCR Worker，提高首張圖片的響應速度
    try { await getOCRWorker(); } catch { /* 初始化失敗時在使用時再處理 */ }

    // 对所有图片文件，都使用vl应用读取摘要
    const startIndexImageTime = Date.now();
    await indexImageFiles();
    const endIndexImageTime = Date.now();
    logger.info(`所有图片索引完成。耗时: ${endIndexImageTime - startIndexImageTime} 毫秒`);
    const notification: INotification = {
        id: 'visual-index',
        text: 'OCR 索引已全部完成',
        type: 'success',
    }
    sendToRenderer('system-info', notification);

    // 任務結束後釋放 OCR Worker
    await terminateOCRWorker();
}

/**
 * 第二步：索引所有图片
 */
async function indexImageFiles() {

    const db = getDatabase()
    // 使用ext字段查询图片文件（ext字段存储的是带点的扩展名）
    const selectStmt = db.prepare(
        'SELECT path FROM files WHERE ext IN (\'.jpg\', \' .png\', \' .jpeg\') AND size > 50 * 1024 AND summary IS NULL AND skip_ocr = 0'
    )
    const files = selectStmt.all() as Array<{ path: string }>;
    // 总共需要视觉处理的文件数量
    let totalFiles = files.length;
    logger.info(`一共找到 ${files.length} 个图片，准备视觉索引服务`)


    // 编程for await 循环，每个文件都等待视觉索引服务完成
    for await (const file of files) {
        try {
            await waitForIndexImage();
            const notification: INotification = {
                id: 'visual-index',
                text: `OCR 服务已启动 剩余 ${totalFiles}`,
                type: 'loadingQuestion',
                tooltip: 'OCR 服务：AI会识别图片中的文字，你可以直接搜索图片中的文字，而不仅是名称。你可前往【设置】手动关闭'
            }
            sendToRenderer('system-info', notification)
            const summary = await summarizeImage(file.path);
            // logger.info(`图片摘要: ${summary}`);
            // 更新数据库
            const updateStmt = db.prepare(`UPDATE files SET summary = ? WHERE path = ?`);
            const res = updateStmt.run(summary, file.path);
            if (res.changes > 0) {
                logger.info(`剩余处理图片数: ${totalFiles}`);
                totalFiles--
                continue
            }

        } catch (error) {
            // 更新数据库记录无需再OCR
            const updateStmt = db.prepare(`UPDATE files SET skip_ocr = 1 WHERE path = ?`);
            const res = updateStmt.run(file.path);
            if (res.changes > 0) {
                logger.info(`已经记录跳过OCR`)
            }
            const msg = error instanceof Error ? error.message : '图片索引服务失败';
            logger.error(`图片索引服务失败:${msg}；文件路径:${file.path}`)
        }
    }
}

/**
 * 第三步：单个图片摘要函数 
 * @param imagePath 图片路径
 * @returns 图片摘要
 */
export async function summarizeImage(imagePath: string): Promise<string> {
    let timeoutId: NodeJS.Timeout;
    try {
        const timeout = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error('OCR 处理超时（60秒）'));
            }, 60000);
        })

        const summary = await Promise.race([
            processImage(imagePath),
            timeout
        ]);

        clearTimeout(timeoutId);
        return summary;
    } catch (error) {
        clearTimeout(timeoutId);
        // 被reject（失败）后，走这里，会 立即将这个 Promise 的拒绝原因作为异常抛出 。
        const msg = error instanceof Error ? error.message : '图片摘要生成失败';
        // logger.error(`图片摘要生成失败:${msg}；文件路径:${imagePath}`)
        throw new Error(msg);
    }
}


/**
 * OCR索引
 * @param imagePath 
 * @returns 
 */
const processImage = (imagePath: string): Promise<string> => {

    const resourcesPath = pathConfig.get('resources')
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB：過大的圖片容易導致 wasm 报错

    return new Promise(async (resolve, reject) => {
        try {
            // 基本校验：過大文件直接跳過，避免 Aborted(-1)
            try {
                const stat = fs.statSync(imagePath);
                if (stat.size > MAX_IMAGE_SIZE) {
                    return reject(new Error('图片过大，已跳过（>20MB）'));
                }
            } catch { /* 忽略 stat 失败 */ }

            const worker = await getOCRWorker();
            const ret = await worker.recognize(imagePath);
            resolve(ret.data.text)
        } catch (error) {
            const msg = error instanceof Error ? error.message : '图片处理失败';
            logger.error(`图片处理失败: ${msg}`);
            reject(new Error(msg));
        }
    });
}
