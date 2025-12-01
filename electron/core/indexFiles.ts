import * as path from 'path';
import { execSync } from 'child_process';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import pathConfig from './pathConfigs.js';
import { getDatabase, setConfig, insertProgramInfo, getConfig } from '../database/sqlite.js';
import { setIndexUpdate, waitForIndexImage, waitForIndexUpdate } from './appState.js';
import { sendToRenderer } from '../main.js';
import { INotification } from '../types/system.js';
import { logger } from './logger.js';
import { app, nativeImage, shell } from 'electron';
import * as os from 'os';
import * as fs from 'fs'
import { extractIcon, savePngBuffer } from './iconExtractor.js';
import { getFileTypeByExtension, FileType } from '../units/enum.js';
import { ImageSever } from './imageSever.js';
import { documentSeverSingleton } from '../sever/documentSever.js';
import { findRecentFolders } from './system.js';
import { ocrSeverSingleton } from '../sever/ocrSever.js';

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
    '.ppt', '.txt', '.lnk', '.pdf', '.md', '.jpg', '.jpeg', '.png', '.gif'
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
        const allFiles: FileInfo[] = results.flat() as unknown as FileInfo[]; // flat方法展开二维数组

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

        let installedPrograms: Array<{
            DisplayName: string;
            Publisher: string;
            InstallLocation: string;
            DisplayIcon: string;
        }> = [];
        // 获取已安装程序列表
        if (process.platform === 'win32') {
            installedPrograms = getInstalledPrograms();
        }
        else {
            installedPrograms = getMacProgramsAndImages().programs;
        }

        // 插入程序信息到数据库
        installedPrograms.forEach(program => {
            insertProgramInfo(program);
        });

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
const getInstalledPrograms = () => {
    try {
        logger.info('正在获取Windows已安装程序列表...');
        const ps1Path = pathConfig.get('getPrograms');
        // 兼容中文应用程序 chcp 65001
        const output = execSync(`chcp 65001 | powershell -ExecutionPolicy Bypass -File "${ps1Path}"`, {
            encoding: 'buffer'
        });

        const jsonStr = output.toString('utf8');   // 显式 UTF-8 解码
        const programs = JSON.parse(jsonStr);
        const programList = Array.isArray(programs) ? programs : [programs];

        logger.info(`找到 ${programList.length} 个已安装程序`);
        return programList.filter(program =>
            program.DisplayName &&
            program.DisplayName.trim() !== '' &&
            !program.DisplayName.includes('Microsoft Visual C++') && // 过滤运行库
            !program.DisplayName.includes('Microsoft .NET') &&
            !program.DisplayName.includes('Update for') &&
            !program.DisplayName.includes('Security Update')
        );
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
 * 视觉索引服务
 * 索引最近的访问文件
 */
export const indexImagesService = async (): Promise<void> => {
    await waitForIndexUpdate();
    logger.info('索引更新完毕')
    // 对所有图片文件，都使用vl应用读取摘要
    // const startIndexImageTime = Date.now();
    const recentPaths = findRecentFolders();
    // 总共需要视觉处理的文件数量
    logger.info(`一共找到 ${recentPaths.length} 个图片，准备视觉索引服务`)
    await Promise.all(recentPaths.map(async (file) => {
        await indexSingleFile(file);
        // await ocrSeverSingleton.enqueue(file);
    }))
    // 任務結束後釋放 OCR Worker
    // await ocrSeverSingleton.terminateOCRWorker();
}


/**
 * 索引单个文件
 * @param filePath 文件路径
 */
export const indexSingleFile = async (filePath: string): Promise<void> => {
    // 判断是否安装 AI 服务
    const aiInstalled = !!getConfig('aiModel_installed');
    const db = getDatabase();
    const imageSever = aiInstalled ? new ImageSever() : null;
    // 判断类型（图片/文档/其他）
    const ext = path.extname(filePath).toLowerCase();
    const fileType = getFileTypeByExtension(ext);

    console.log(`文件类型 ${fileType} 扩展: ${ext}`);

    if (fileType === FileType.Image && !aiInstalled) {
        // 类型为图片，且未安装模型，采用OCR
        await ocrSeverSingleton.enqueue(filePath);
    } else if (fileType === FileType.Document && !aiInstalled) {
        // 类型为文档，且未安装模型，读取全文
        await documentSeverSingleton.enqueue(filePath);
    } else if (fileType === FileType.Image && aiInstalled) {
        // 图片类型，安装模型，使用vl应用读取摘要a
        // await ocrSeverSingleton.enqueue(filePath); //临时测试
    } else if (fileType === FileType.Document && aiInstalled) {
        // 文档类型，安装模型，使用vl应用读取摘要
        await documentSeverSingleton.enqueue(filePath);
    } else {
        logger.info(`文件类型 ${fileType} 不支持索引: ${filePath}`);
    }
}