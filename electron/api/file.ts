import { ipcMain, BrowserWindow } from 'electron';
import { indexAllFilesWithWorkers } from '../core/indexFiles.js';
import { aiSearch, searchFiles } from '../core/search.js';
import { init, sendToRenderer } from '../main.js';
import { checkGPU, openDir } from '../core/system.js';
import { downloadModel } from '../pythonScript/downloadModle.js';
import { setOpenIndexImages } from '../core/appState.js';
import { getAllConfigs, getConfig, setConfig } from '../database/sqlite.js';

/**
 * 初始化所有与文件相关的 IPC 事件监听器
 * @param mainWindow 主浏览器窗口实例
 */
export function initializeFileApi(mainWindow: BrowserWindow) {

    // 告知node 程序，前端渲染进程已准备就绪
    ipcMain.handle('init', init)

    // 获取用户配置
    ipcMain.handle('get-config', (_event, key?: string) => {
        return key ? getConfig(key) : getAllConfigs();
    })

    // 开启索引
    ipcMain.handle('open-index', indexAllFilesWithWorkers)

    // 搜索文件
    ipcMain.handle('search-files', (_event, keyword: string) => searchFiles(keyword));
    // 执行AI搜索
    ipcMain.handle('ai-search', (_event, query: string) => aiSearch(query));


    // 打开某个路径（📌，需要取代open-file-location）
    ipcMain.on('open-dir', (event, type, path) => { openDir(type, path) });

    // 切换图片视觉索引开关
    ipcMain.on('toggle-index-image', (_event, open) => {
        console.log('open', open)
        setConfig('visual_index_enabled', open, 'boolean'); //设置时需要赋予类型
        setOpenIndexImages(open) //允许或暂停索引图片
    })
}
