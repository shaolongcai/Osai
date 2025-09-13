import { ipcMain, BrowserWindow, shell } from 'electron';
import path from 'path';
import { indexAllFilesWithWorkers } from '../core/indexFiles.js';
import { getFilesCount } from '../database/sqlite.js';
import { searchFiles } from '../core/search.js';
import { sendToRenderer } from '../main.js';
import { checkGPU } from '../core/system.js';
import { downloadModel } from '../pythonScript/downloadModle.js';

/**
 * 初始化所有与文件相关的 IPC 事件监听器
 * @param mainWindow 主浏览器窗口实例
 */
export function initializeFileApi(mainWindow: BrowserWindow) {

    // 处理文件索引请求
    ipcMain.handle('index-files', () => indexAllFilesWithWorkers(sendToRenderer));

    // 处理获取文件数量的请求
    ipcMain.handle('get-files-count', getFilesCount);

    // 搜索文件
    ipcMain.handle('search-files', (_event, keyword: string) => searchFiles(keyword));

    // 渲染准备，监听后，再下载模型
    ipcMain.once('renderer-ready', async () => {
        console.log('前端已就绪，开始下载模型...');
        await checkGPU()
        downloadModel(sendToRenderer);
    });

    // 处理打开文件所在位置的请求
    //   ipcMain.handle('open-file-location', ()=>{});
}
