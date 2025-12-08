import { ipcMain, BrowserWindow } from 'electron';
import { searchFiles, shortSearch } from '../core/search.js';
import { init, sendToRenderer, startIndexTask } from '../main.js';
import { openDir } from '../core/system.js';
import { setOpenIndexImages } from '../core/appState.js';
import { setConfig } from '../database/sqlite.js';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../core/logger.js';
import pathConfig from '../core/pathConfigs.js';


// 获取当前文件路径（ES模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//事件广播
let pendingRequests = new Set<string>();


/**
 * 初始化所有与文件相关的 IPC 事件监听器
 * @param mainWindow 主浏览器窗口实例
 */
export function initializeFileApi(mainWindow: BrowserWindow) {

    // 告知node 程序，前端渲染进程已准备就绪
    ipcMain.handle('init', init)
    // 开始索引所有文件
    ipcMain.handle('start-index', startIndexTask)

    // 搜索文件
    ipcMain.handle('search-files', (_event, keyword: string) => searchFiles(keyword));
    // 快捷搜索
    ipcMain.handle('short-search', (_event, keyword: string) => shortSearch(keyword));

    // 打开某个路径（📌，需要取代open-file-location）
    ipcMain.on('open-dir', (event, type, path) => { openDir(type, path) });

    // 切换图片视觉索引开关
    ipcMain.on('toggle-index-image', (_event, open) => {
        setConfig('visual_index_enabled', open, 'boolean'); //设置时需要赋予类型
        setOpenIndexImages(open) //允许或暂停索引图片
    })

    // 获取图标文件
    ipcMain.handle('get-icon', async (_event, iconPath?: string, ext?: string) => {
        try {
            // 检查是否有iconPath，没有则使用ext获取默认图标
            if (!iconPath && ext) {
                // 去掉ext的点号
                const extNoDot = ext.slice(1);
                iconPath = path.join(pathConfig.get('iconsCache'), `${extNoDot}.png`);
            }

            // 安全检查：确保请求的文件在 iconsCache 目录内
            const iconsCache = pathConfig.get('iconsCache');
            const resolvedPath = path.resolve(iconPath);
            const resolvedCacheDir = path.resolve(iconsCache);

            if (!resolvedPath.startsWith(resolvedCacheDir)) {
                logger.warn(`非法的图标路径访问: ${iconPath}`);
                return null;
            }

            // 检查文件是否存在
            if (!fs.existsSync(resolvedPath)) {
                // logger.warn(`图标文件不存在: ${iconPath}`);
                return null;
            }

            // 读取文件并转换为 base64
            const fileBuffer = fs.readFileSync(resolvedPath);
            const base64Data = fileBuffer.toString('base64');

            return `data:'image/png';base64,${base64Data}`;
        } catch (error) {
            logger.error(`获取图标文件失败: ${iconPath}, 错误: ${error}`);
            return null;
        }
    });
}