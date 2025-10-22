import { ipcMain, BrowserWindow } from 'electron';
import { aiSearch, searchFiles } from '../core/search.js';
import { init, startIndexTask } from '../main.js';
import { openDir } from '../core/system.js';
import { setOpenIndexImages } from '../core/appState.js';
import { getAllConfigs, getConfig, setConfig } from '../database/sqlite.js';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { logger } from '../core/logger.js';


// 获取当前文件路径（ES模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
     * 0、打开文档（可选）
     * 1、摘要
     * 2、标签
     */
    ipcMain.handle('ai-mark', async (_event, filePath: string) => {
        //判断类型
        const stat = fs.statSync(filePath);
        // 获取扩展名
        const ext = path.extname(filePath).toLowerCase();
        // 文档类型
        if (ext === '.docx' || ext === '.doc' || ext === '.pdf' || ext === '.txt') {

        }
        //图片类型
        else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            const summary = await processImageWithWorker(filePath)
            logger.info(`图片摘要: ${summary}`);
        }
        //其他类型
        else {

        }
    });

    // 打开某个路径（📌，需要取代open-file-location）
    ipcMain.on('open-dir', (event, type, path) => { openDir(type, path) });

    // 切换图片视觉索引开关
    ipcMain.on('toggle-index-image', (_event, open) => {
        console.log('open', open)
        setConfig('visual_index_enabled', open, 'boolean'); //设置时需要赋予类型
        setOpenIndexImages(open) //允许或暂停索引图片
    })





    initializeImageWorker()
}

let imageWorker: Worker | null = null;
const pendingRequests = new Map<string, { resolve: Function; reject: Function }>();

// 初始化图片处理Worker
const initializeImageWorker = () => {
    try {
        const workerPath = path.join(__dirname, '../core/imageProcessor.worker.js');
        imageWorker = new Worker(workerPath);

        // 监听Worker消息
        imageWorker.on('message', (response: any) => {
            const { requestId, success, result, error } = response;
            const pending = pendingRequests.get(requestId);

            if (pending) {
                pendingRequests.delete(requestId);
                if (success) {
                    pending.resolve(result);
                } else {
                    pending.reject(new Error(error));
                }
            }
        });

        // 监听Worker错误
        imageWorker.on('error', (error) => {
            console.error(`图片处理Worker错误: ${error.message}`);
            // 重启Worker
            // restartImageWorker();
        });

        // 监听Worker退出
        imageWorker.on('exit', (code) => {
            if (code !== 0) {
                console.warn(`图片处理Worker异常退出，代码: ${code}`);
                // restartImageWorker();
            }
        });

    } catch (error) {
        console.error(`初始化图片处理Worker失败: ${error}`);
    }
};


// 使用线程处理图片
const processImageWithWorker = (imagePath: string, prompt: string = '请使用中文摘要这张图片，请简洁描述，不要重复内容，控制在300字以内'): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!imageWorker) {
            reject(new Error('图片处理Worker未初始化'));
            return;
        }

        const requestId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 存储Promise的resolve和reject
        pendingRequests.set(requestId, { resolve, reject });

        // 发送任务到Worker
        imageWorker.postMessage({
            imagePath,
            prompt,
            requestId
        });
    });
};
