import * as path from 'path';
import { execSync } from 'child_process';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import pathConfig from './pathConfigs.js';
import { getDatabase, setConfig, insertProgramInfo, getConfig } from '../database/sqlite.js';
import { setIndexUpdate, waitForIndexUpdate } from './appState.js';
import { sendToRenderer } from '../main.js';
import { INotification2 } from '../types/system.js';
import { logger } from './logger.js';
import { app, nativeImage } from 'electron';
import * as os from 'os';
import * as fs from 'fs'
import { extractIcon, savePngBuffer } from './iconExtractor.js';
import { getFileTypeByExtension, FileType } from '../units/enum.js';
import { documentSeverSingleton } from '../sever/documentSever.js';
import { findRecentFolders } from './system.js';
import { ocrSeverSingleton } from '../sever/ocrSever.js';
import { aiSeverSingleton } from '../sever/aiSever.js';
import { normalizeWinPath } from '../units/pathUtils.js';
import { shell } from 'electron';
import { pinyin } from 'pinyin-pro';
import { calculateMd5 } from '../units/math.js';

type FileInfo = {
    filePath: string;
    name: string;
    ext: string;
};

// 获取当前文件路径（ES模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 支持获取图标的格式
const supportedIconFormats = [
    '.exe', '.xslx', '.wps', '.csv', '.xls', '.doc', '.docx', '.pptx',
    '.ppt', '.txt', '.lnk', '.pdf', '.md', '.jpg', '.jpeg', '.png', '.gif', '.md'
];

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
const deleteExtraFiles = async (allFiles: FileInfo[]) => {
    const db = getDatabase()
    const allFilesSet = new Set(allFiles.map(file => file.filePath));
    const selectStmt = db.prepare('SELECT path FROM files');
    const filesInDb = selectStmt.all() as { path: string }[];
    const filesToDelete = filesInDb.filter((file) => !allFilesSet.has(file.path));
    if (filesToDelete.length > 0) {
        logger.info(`发现 ${filesToDelete.length} 个需要删除的记录。`);
        // 准备删除语句并开启一个事务来批量删除
        const deleteStmt = db.prepare('DELETE FROM files WHERE path = ?');
        const deleteTransaction = db.transaction((files) => {
            for (const file of files) {
                deleteStmt.run(file.path);
            }
        });

        // 执行事务
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
export async function indexAllFilesWithWorkers(): Promise<FileInfo[]> {

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

    const promises = drives.map(drive => {
        return new Promise<string[]>((resolve, reject) => {
            // 明确指定 worker 脚本的路径
            // 我们需要指向编译后的 .js 文件
            const workerPath = path.join(__dirname, '../workers/indexer.worker.js');

            const worker = new Worker(workerPath, {
                workerData: { drive, dbPath }
            });

            worker.on('message', (message) => {
                if (message.status === 'success') {
                    logger.info(`驱动器 ${drive} 索引完成，找到 ${message.files.length} 个文件。`);
                    completedDrives++;
                    completedFiles += message.files.length;
                    resolve(message.files);
                }
                else if (message.type === 'progress') {
                    // 如果是进度消息，就通过 webContents 发送给前端
                    sendToRenderer('index-progress', { message: message.content })
                } else {
                    logger.error(`驱动器 ${drive} 索引失败:${JSON.stringify(message.error)}`);
                    resolve([]);
                }
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
        const notification: INotification2 = {
            id: 'indexTask',
            messageKey: 'app.search.indexLoading',
            type: 'success',
        }
        sendToRenderer('index-progress', notification)

        const results = await Promise.all(promises);
        const allFiles: FileInfo[] = results.flat() as unknown as FileInfo[]; // flat方法展开二维数组

        // 发送完成消息
        const formattedTotal = completedFiles.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); //加入千分位
        const notification2: INotification2 = {
            id: 'indexTask',
            messageKey: 'app.search.indexFile',
            variables: { count: formattedTotal },
            type: 'success',
        }
        sendToRenderer('system-info', notification2)

        // 寻找所有扩展名,并对应第一个文件
        const extToFileMap = new Map<string, string>();
        allFiles.forEach(file => {
            if (!extToFileMap.has(file.ext)) {
                extToFileMap.set(file.ext, file.filePath);
            }
        });
        const extensions = new Set(extToFileMap.keys());
        logger.info(`找到 ${extensions.size} 个不同的扩展名`);


        // 对每个扩展名,提取图标
        for (const ext of extensions) {
            // 检查扩展名是否在支持的格式中
            if (!supportedIconFormats.includes(ext)) {
                continue;
            }
            const filePath = extToFileMap.get(ext);
            if (!filePath) {
                continue;
            }

            // 判断平台
            if (process.platform === 'win32') {
                //获取256*256的图标，getFileIcon无法获取
                const normalizedPath = filePath.replace(/\//g, '\\');
                const iconBuffer = await extractIcon(normalizedPath, 256);
                if (iconBuffer) {
                    logger.info(`添加新的图标： ${ext}`);
                    // ext 去掉.
                    const extWithoutDot = ext.slice(1);
                    savePngBuffer(iconBuffer, path.join(pathConfig.get('iconsCache'), `${extWithoutDot}.png`));
                }
                else {
                    continue;
                }
            }
            else {
                try {
                    // 获取图标
                    const nativeImage = await app.getFileIcon(filePath, { size: 'normal' });
                    if (nativeImage) {
                        const { width, height } = nativeImage.getSize();
                        const outBuf = Math.max(width, height) > 256
                            ? nativeImage.resize({ width: 256, height: 256 }).toPNG({ scaleFactor: 4 })
                            : nativeImage.toPNG({ scaleFactor: 4 });
                        const extWithoutDot = ext.slice(1);
                        savePngBuffer(outBuf, path.join(pathConfig.get('iconsCache'), `${extWithoutDot}.png`));
                        logger.info(`添加新的图标(macOS)： ${ext}`);
                    }
                    else {
                        continue
                    }
                } catch (error) {
                    logger.error(`获取 ${ext} 图标失败:${JSON.stringify(error)}`);
                    continue;
                }
            }
        }

        const endTime = Date.now();
        logger.info(`所有 Worker 线程索引完成。共找到 ${allFiles.length} 个文件，耗时: ${endTime - startTime} 毫秒`);



        // let installedPrograms: Array<{
        //     DisplayName: string;
        //     Publisher: string;
        //     InstallLocation: string;
        //     DisplayIcon: string;
        // }> = [];
        let installedProgram = [] as FileInfo[];
        // 获取已安装程序列表 （改为使用快捷方式列表替换）
        // if (process.platform === 'win32') {
        //     installedProgram = await getInstalledPrograms();
        // }
        // else {
        //     // installedPrograms = getMacProgramsAndImages().programs;
        // }

        // 插入程序信息到数据库
        // installedPrograms.forEach(program => {
        //     insertProgramInfo(program);
        // });

        // 添加应用程序的路径到allFiles
        installedProgram.forEach(file => {
            allFiles.push(file);
        });

        // 删除多余的数据库记录（最后才放）
        await deleteExtraFiles(allFiles);

        // 索引更新
        setIndexUpdate(true);
        // 记录索引时间，以及索引的文件数量
        setConfig('last_index_time', Date.now());
        setConfig('last_index_file_count', allFiles.length);

        await indexRecently()
        return allFiles;
    } catch (error) {
        // logger.error(`一个或多个 Worker 索引任务失败。${JSON.stringify(error)}`);
        return []; // 发生严重错误时返回空数组
    }
}


// 获取图标线程 （暂时不用）
async function extractIconsInWorker(extToFileMap: Map<string, string>): Promise<void> {
    return new Promise((resolve, reject) => {

        const workerPath = path.join(__dirname, '../workers/icon.worker.js');
        const worker = new Worker(workerPath, {
            // workerData: { drive, dbPath, excludedDirNames: excludedDirNamesArray }
        });

        worker.on('message', (msg: any) => {
            if (msg?.type === 'done') {
                worker.terminate();
                resolve();
            }
            if (msg?.type === 'error') {
                // 记录错误，不阻塞其他扩展的处理
                console.error('图标提取线程错误:', msg.error);
            }
        });

        worker.on('error', (err) => {
            console.error('图标提取线程崩溃:', err);
            worker.terminate();
            reject(err);
        });

        worker.postMessage({ extToFileMap: Object.fromEntries(extToFileMap) });
    });
}


/**
 * 获取Windows已安装程序列表
 * @returns 已安装程序信息数组
 */
const getInstalledPrograms = async (): Promise<FileInfo[]> => {
    try {
        logger.info('正在获取Windows已安装程序列表...');
        // 枚举两个快捷方式的分支
        const dirs = [
            `${process.env.PROGRAMDATA}\\Microsoft\\Windows\\Start Menu\\Programs`,  // 所有用户
            `${process.env.APPDATA}\\Microsoft\\Windows\\Start Menu\\Programs`  // 当前用户
        ];
        const lnkList = [];
        function walk(dir: string) {
            let entries;
            try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
            catch { return; }          // 目录不存在就跳过
            for (const ent of entries) {
                const full = path.join(dir, ent.name);
                if (ent.isDirectory()) walk(full);          // 递归子目录
                else if (ent.name.endsWith('.lnk')) lnkList.push(full);
            }
        }

        dirs.forEach(walk);
        const filePahtList = [] as FileInfo[];
        lnkList.forEach(lnkPath => {
            try {
                const info = shell.readShortcutLink(lnkPath);
                console.log(`${path.basename(lnkPath, '.lnk')}  ->  ${info.target}`);

                const appName = path.basename(lnkPath, '.lnk')
                //获取拼音
                const pinyinArray = pinyin(appName, { toneType: "none", type: "array" }); // ["han", "yu", "pin", "yin"]
                const pinyinHead = pinyinArray.map((item) => item[0]).join("");

                const database = getDatabase();
                // 获取size与ext
                const stats = fs.statSync(info.target);
                const size = stats.size;
                const ext = path.extname(info.target).toLowerCase();
                const md5 = calculateMd5(info.target, size, stats.mtimeMs);
                filePahtList.push({
                    filePath: info.target,
                    name: appName,
                    ext: ext,
                });
                // 原子 UPSERT：存在即更新，不存在则插入
                const upsertStmt = database.prepare(`
                INSERT INTO files (md5,path, name, ext, size, modified_at)
                VALUES (?,?, ?, ?, ?, ?)
                ON CONFLICT(path) DO UPDATE SET
                    md5 = excluded.md5,
                    name = excluded.name,
                    ext = excluded.ext,
                    size = excluded.size,
                    modified_at = excluded.modified_at
            `);
                const changes = upsertStmt.run(md5, info.target, appName, ext, size, stats.mtimeMs);
                if (changes.changes > 0) {
                    logger.info(`成功索引程序：${appName}`);
                }
            } catch (e) {
                console.error(e)
                // 部分系统快捷方式无法解析，可忽略
            }
        });

        return filePahtList;
        // const ps1Path = pathConfig.get('getPrograms');
        // // 兼容中文应用程序 chcp 65001
        // const output = execSync(`chcp 65001 | powershell -ExecutionPolicy Bypass -File "${ps1Path}"`, {
        //     encoding: 'buffer'
        // });

        // const jsonStr = output.toString('utf8');   // 显式 UTF-8 解码
        // const programs = JSON.parse(jsonStr);
        // const programList = Array.isArray(programs) ? programs : [programs];

        // logger.info(`找到 ${programList.length} 个已安装程序`);
        // return programList.filter(program =>
        //     program.DisplayName &&
        //     program.DisplayName.trim() !== '' &&
        //     !program.DisplayName.includes('Microsoft Visual C++') && // 过滤运行库
        //     !program.DisplayName.includes('Microsoft .NET') &&
        //     !program.DisplayName.includes('Update for') &&
        //     !program.DisplayName.includes('Security Update')
        // );
    } catch (error) {
        console.error(error)
        // logger.error(`获取已安装程序列表失败: ${error}`);
        return [];
    }
};


/**
 * 获取 macOS 端的「已安装应用」与「常见目录图片」
 * 1) 应用来源：/Applications 与 ~/Applications 下的 .app 包
 * 返回结构与 Windows 程序入库所需字段保持一致，便于后续复用
 */
const getMacProgramsAndImages = (): {
    programs: Array<{
        DisplayName: string;
        Publisher: string;
        InstallLocation: string;
        DisplayIcon: string;
    }>;
} => {
    try {
        // 仅在 macOS 执行
        if (os.platform() !== 'darwin') {
            logger.info('当前非 macOS，跳过获取 Mac 程序与图片');
            return { programs: [] };
        }

        logger.info('正在获取 macOS 应用与图片列表...');

        // 1) 扫描应用目录，收集 .app
        const appDirs = [
            '/Applications',
            path.join(os.homedir(), 'Applications'),
        ];

        const appBundles: string[] = [];
        for (const dir of appDirs) {
            try {
                if (!fs.existsSync(dir)) continue;
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isDirectory() && entry.name.toLowerCase().endsWith('.app')) {
                        appBundles.push(path.join(dir, entry.name));
                    }
                }
            } catch (e) {
                logger.error(`扫描应用目录失败: ${dir}, ${String(e)}`);
            }
        }

        // 解析 Info.plist，生成与入库一致的字段
        const programs = appBundles.map(appPath => {
            const infoPlist = path.join(appPath, 'Contents', 'Info.plist');
            let displayName = path.basename(appPath, '.app');
            let identifier = '';
            let version = '';
            let iconFile = '';

            try {
                if (fs.existsSync(infoPlist)) {
                    // 使用系统自带 plutil 转为 JSON 并解析
                    const plistJson = execSync(`plutil -convert json -o - "${infoPlist}"`, { encoding: 'utf8', shell: '/bin/bash' });
                    const info = JSON.parse(plistJson);

                    displayName = info.CFBundleDisplayName || info.CFBundleName || displayName;
                    identifier = info.CFBundleIdentifier || '';
                    version = info.CFBundleShortVersionString || info.CFBundleVersion || '';

                    // 优先从 CFBundleIconFile/CFBundleIcons 推断图标文件
                    if (typeof info.CFBundleIconFile === 'string') {
                        iconFile = info.CFBundleIconFile.endsWith('.icns')
                            ? info.CFBundleIconFile
                            : `${info.CFBundleIconFile}.icns`;
                    } else if (info.CFBundleIcons?.CFBundlePrimaryIcon?.CFBundleIconName) {
                        const iconName = info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconName;
                        iconFile = typeof iconName === 'string'
                            ? (iconName.endsWith('.icns') ? iconName : `${iconName}.icns`)
                            : '';
                    }
                }
            } catch (e) {
                logger.error(`解析 Info.plist 失败: ${infoPlist}, ${String(e)}`);
            }

            // 计算图标绝对路径（若存在）
            let displayIconSrc = '';
            if (iconFile) {
                const iconPath = path.join(appPath, 'Contents', 'Resources', iconFile);
                if (fs.existsSync(iconPath)) {
                    displayIconSrc = iconPath;
                }
            }

            // 将 .icns 转为 PNG 并缓存到 iconsCache/apps
            let displayIcon = '';
            try {
                const cacheRoot = pathConfig.get('iconsCache');
                const appIconDir = path.join(cacheRoot, 'apps');
                if (!fs.existsSync(appIconDir)) fs.mkdirSync(appIconDir, { recursive: true });

                if (displayIconSrc && path.extname(displayIconSrc).toLowerCase() === '.icns') {
                    const image = nativeImage.createFromPath(displayIconSrc);
                    if (!image.isEmpty()) {
                        const pngBuf = image.resize({ width: 256, height: 256 }).toPNG();
                        const stat = fs.statSync(displayIconSrc);
                        const key = `${path.parse(appPath).name}_${stat.size}_${Math.floor(stat.mtimeMs)}`.replace(/[^a-zA-Z0-9_]/g, '');
                        const outPath = path.join(appIconDir, `${key}.png`);
                        fs.writeFileSync(outPath, pngBuf);
                        logger.info(`macOS 图标转换成功(nativeImage): ${displayIconSrc} -> ${outPath}`);
                        displayIcon = outPath;
                    } else {
                        // logger.warn(`nativeImage 解析 .icns 失败或返回空图像: ${displayIconSrc}`);
                        try {
                            const stat = fs.statSync(displayIconSrc);
                            const key = `${path.parse(appPath).name}_${stat.size}_${Math.floor(stat.mtimeMs)}`.replace(/[^a-zA-Z0-9_]/g, '');
                            const outPath = path.join(appIconDir, `${key}.png`);
                            execSync(`sips -s format png \"${displayIconSrc}\" --out \"${outPath}\"`, { shell: '/bin/bash', stdio: 'pipe' });
                            if (fs.existsSync(outPath)) {
                                logger.info(`macOS 图标转换成功(sips): ${displayIconSrc} -> ${outPath}`);
                                displayIcon = outPath;
                            } else {
                                logger.warn(`sips 转换后未生成 PNG 文件: ${outPath}`);
                            }
                        } catch (se) {
                            logger.error(`sips 转换 .icns 失败: ${displayIconSrc}, ${String(se)}`);
                        }
                    }
                }
            } catch (e) {
                logger.warn(`macOS 图标转换失败: ${displayIconSrc}, ${String(e)}`);
            }

            // 依据标识推断 Publisher（com.vendor.product -> Vendor）
            let publisher = 'Unknown';
            try {
                const parts = identifier.split('.');
                if (parts.length >= 2) {
                    const vendor = parts[1];
                    publisher = vendor.charAt(0).toUpperCase() + vendor.slice(1);
                }
                if (identifier.startsWith('com.apple')) publisher = 'Apple';
            } catch { }

            return {
                DisplayName: displayName,
                Publisher: publisher || identifier || 'Unknown',
                InstallLocation: appPath,
                DisplayIcon: displayIcon,
            };
        }).filter(p => p.DisplayName && p.DisplayName.trim() !== '');

        logger.info(`找到 ${programs.length} 个 macOS 应用`);

        // 2) 收集常见目录下的图片文件（jpg/jpeg/png/gif）
        // const imageDirs = [
        //     path.join(os.homedir(), 'Pictures'),
        //     path.join(os.homedir(), 'Desktop'),
        //     path.join(os.homedir(), 'Downloads'),
        // ];

        return { programs };
    } catch (error) {
        logger.error(`获取 macOS 程序与图片失败: ${String(error)}`);
        return { programs: [] };
    }
};


/**
 * 深度索引最近的访问文件
 * 大小、修改时间、全文、OCR
 */
export const indexRecently = async (): Promise<void> => {

    // 判断是否配置 AI 服务
    const aiInstalled = await aiSeverSingleton.checkAIProvider();
    if (!aiInstalled) {
        logger.warn(`未配置 AI 服务,降级到普通索引`);
    }
    await waitForIndexUpdate();
    logger.info('索引更新完毕')
    const recentPaths = findRecentFolders();
    /**
     * 📌📌 需要保持阻塞，并发多个写入影子表，可能会对同个row_id操作，造成database损坏 （请保证对sqlite的操作都是串行的）
     * 允许并发读，不允许并发写
     * FTS5 触发器在写入时，会为 同一条主表记录 向影子表插入 多条内部条目 （每个 token 一行）。并发会插入重复的token
     */
    for (const file of recentPaths) {
        if (!fs.existsSync(file)) {
            logger.warn(`文件不存在: ${file}`);
            continue;
        }
        indexSingleFile(file, aiInstalled); //这里不要加await，否则队列里只会有一个任务
    }
    // 任務結束後釋放 OCR Worker
    // await ocrSeverSingleton.terminateOCRWorker();
}


/**
 * 索引单个文件
 * @param filePath 文件路径
 */
export const indexSingleFile = async (filePath: string, aiInstalled: boolean): Promise<void> => {
    // 判断类型（图片/文档/其他）
    const ext = path.extname(filePath).toLowerCase();
    const fileType = getFileTypeByExtension(ext);
    // 统一在这里路径归一
    const normalizedPath = normalizeWinPath(filePath);

    if (fileType === FileType.Image && !aiInstalled) {
        // 类型为图片，且未安装模型，采用OCR
        await ocrSeverSingleton.enqueue(normalizedPath);
    } else if (fileType === FileType.Document && !aiInstalled) {
        // 类型为文档，且未安装模型，读取全文
        await documentSeverSingleton.enqueue(normalizedPath);
    } else if (fileType !== FileType.Other && aiInstalled) {
        logger.info(`处理文档索引，文件路径: ${normalizedPath}`);
        // 使用ai服务，标记文件
        await aiSeverSingleton.enqueue(normalizedPath, fileType);
    } else {
        logger.warn(`文件类型 ${fileType} 不支持索引: ${normalizedPath}`);
    }
    return
}