import { ipcMain, BrowserWindow } from 'electron';
import { indexAllFilesWithWorkers } from '../core/indexFiles.js';
import { searchFiles } from '../core/search.js';
import { sendToRenderer } from '../main.js';
import { checkGPU, openDir } from '../core/system.js';
import { downloadModel } from '../pythonScript/downloadModle.js';
// import { shutdownVisionService } from '../pythonScript/imageService.js';
import { setOpenIndexImages } from '../core/appState.js';

/**
 * 初始化所有与文件相关的 IPC 事件监听器
 * @param mainWindow 主浏览器窗口实例
 */
export function initializeFileApi(mainWindow: BrowserWindow) {
    // 开启索引
    ipcMain.handle('open-index', indexAllFilesWithWorkers)

    // 搜索文件
    ipcMain.handle('search-files', (_event, keyword: string) => searchFiles(keyword));

    // 渲染准备，监听后，再下载模型
    ipcMain.handle('renderer-ready', async () => {
        const gpuInfo = await checkGPU();
        downloadModel(sendToRenderer);
        return gpuInfo;
    });

    // 打开某个路径（📌，需要取代open-file-location）
    ipcMain.on('open-dir', (event, type, path) => { openDir(type, path) });

    // 切换图片视觉索引开关
    ipcMain.on('toggle-index-image', (_event, open) => {
        setOpenIndexImages(open) //允许或暂停索引图片
    })
}
