import { ipcMain, BrowserWindow } from 'electron';
import { aiSearch, searchFiles } from '../core/search.js';
import { init, sendToRenderer, startIndexTask } from '../main.js';
import { extractCUDA, openDir } from '../core/system.js';
import { setOpenIndexImages } from '../core/appState.js';
import { setConfig } from '../database/sqlite.js';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { logger } from '../core/logger.js';
import { getFileTypeByExtension, FileType } from '../units/enum.js';
import { INotification } from '../types/system.js';
import { ImageSever } from '../core/imageSever.js';
import { DocumentSever } from '../core/documentSever.js';


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
    // 执行AI搜索
    ipcMain.handle('ai-search', (_event, query: string) => aiSearch(query));

    /**
     * 执行AI Mark功能
     */
    ipcMain.handle('ai-mark', async (_event, filePath: string) => {

        const imageSever = new ImageSever() // 初始化图片处理服务（用完会自动释放）
        const documentSever = new DocumentSever() // 初始化文档服务（用完会自动释放）

        // 尝试找到CUDA并解压
        try {
            await extractCUDA();
        } catch (error) {
            const notification: INotification = {
                id: 'downloadGpuSever',
                text: 'CUDA服务解压失败,请重试',
                type: 'warning',
                tooltip: `你可以重新使用AImark功能，会重新解压，错误信息：${error}`
            }
            sendToRenderer('system-info', notification)
        }

        try {
            pendingRequests.add(filePath)
            const notification: INotification = {
                id: 'ai-mark',
                text: `AI 正在分析文档... 剩余 ${pendingRequests.size}`,
                type: 'loading',
                // tooltip: ''
            }
            sendToRenderer('system-info', notification)

            //判断类型
            // const stat = fs.statSync(filePath);
            // 获取扩展名
            const ext = path.extname(filePath).toLowerCase();
            const fileType = getFileTypeByExtension(ext);
            // 文档类型
            if (fileType === FileType.Document) {
                await documentSever.readDocument(ext, filePath)
            }
            //图片类型
            else if (fileType === FileType.Image) {
                await imageSever.processImageByAi(filePath)
            }
            //其他类型
            else {

            }
        } catch (error) {
            logger.error(`AI mark失败: ${error}`);
            pendingRequests.delete(filePath)
            const notification: INotification = {
                id: 'ai-mark',
                text: `AI 正在记录文档失败 剩余 ${pendingRequests.size}`,
                type: 'warning',
                // tooltip: `失败原因：${error}`
            }
            sendToRenderer('system-info', notification)
        }
    });

    // 打开某个路径（📌，需要取代open-file-location）
    ipcMain.on('open-dir', (event, type, path) => { openDir(type, path) });

    // 切换图片视觉索引开关
    ipcMain.on('toggle-index-image', (_event, open) => {
        setConfig('visual_index_enabled', open, 'boolean'); //设置时需要赋予类型
        setOpenIndexImages(open) //允许或暂停索引图片
    })
}