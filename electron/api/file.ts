import { ipcMain, BrowserWindow } from 'electron';
import { aiSearch, searchFiles } from '../core/search.js';
import { init, startIndexTask } from '../main.js';
import { openDir } from '../core/system.js';
import { setOpenIndexImages } from '../core/appState.js';
import { getAllConfigs, getConfig, setConfig } from '../database/sqlite.js';
import { severDownloader } from '../core/downloader.js';

/**
 * 初始化所有与文件相关的 IPC 事件监听器
 * @param mainWindow 主浏览器窗口实例
 */
export function initializeFileApi(mainWindow: BrowserWindow) {

    // 告知node 程序，前端渲染进程已准备就绪
    ipcMain.handle('init', init)
    // 开始索引所有文件
    ipcMain.handle('start-index', startIndexTask)

    // 获取用户配置
    ipcMain.handle('get-config', (_event, key?: string) => { return key ? getConfig(key) : getAllConfigs() })
    // 设置用户配置
    ipcMain.handle('set-config', (_event, key: string, value: any, type?: string) => { setConfig(key, value, type) })

    // 搜索文件
    ipcMain.handle('search-files', (_event, keyword: string) => searchFiles(keyword));
    // 执行AI搜索
    ipcMain.handle('ai-search', (_event, query: string) => aiSearch(query));
    // 安装GPU服务
    ipcMain.handle('install-gpu-server', (_event) => {
        const downloader = new severDownloader();
        downloader.downloadFiles();
    });


    // 打开某个路径（📌，需要取代open-file-location）
    ipcMain.on('open-dir', (event, type, path) => { openDir(type, path) });

    // 切换图片视觉索引开关
    ipcMain.on('toggle-index-image', (_event, open) => {
        console.log('open', open)
        setConfig('visual_index_enabled', open, 'boolean'); //设置时需要赋予类型
        setOpenIndexImages(open) //允许或暂停索引图片
    })
}
