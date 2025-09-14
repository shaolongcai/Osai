import { ipcMain, BrowserWindow } from 'electron';
import { indexImagesService } from '../core/indexFiles.js';
import { getFilesCount } from '../database/sqlite.js';
import { searchFiles } from '../core/search.js';
import { sendToRenderer } from '../main.js';
import { checkGPU } from '../core/system.js';
import { downloadModel } from '../pythonScript/downloadModle.js';
// import { shutdownVisionService } from '../pythonScript/imageService.js';
import { setOpenIndexImages } from '../core/appState.js';

/**
 * 初始化所有与文件相关的 IPC 事件监听器
 * @param mainWindow 主浏览器窗口实例
 */
export function initializeFileApi(mainWindow: BrowserWindow) {

    // 处理获取文件数量的请求
    ipcMain.handle('get-files-count', getFilesCount);

    // 搜索文件
    ipcMain.handle('search-files', (_event, keyword: string) => searchFiles(keyword));

    // 渲染准备，监听后，再下载模型
    ipcMain.handle('renderer-ready', async () => {
        const gpuInfo = await checkGPU();
        downloadModel(sendToRenderer);
        return gpuInfo;
    });

    // 开启图片视觉索引
    ipcMain.on('index-image', indexImagesService)
    // 切换图片视觉索引开关
    ipcMain.on('toggle-index-image', (_event, open) => {
        console.log('图片索引切换为', open)
        setOpenIndexImages(open)
    })

    // 处理打开文件所在位置的请求
    //   ipcMain.handle('open-file-location', ()=>{});
}
