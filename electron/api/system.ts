import { ipcMain } from 'electron';
import { logger } from '../core/logger.js';
import { severDownloader } from '../core/downloader.js';
import { initializeModel } from '../core/model.js';
import { getConfig, setConfig } from '../database/sqlite.js';
import { sendToRenderer } from '../main.js';


export function initializeSystemApi() {



    // 安装GPU服务
    ipcMain.handle('install-gpu-server', (_event) => {
        const downloader = new severDownloader();
        downloader.downloadFiles();
    });

    // 安装AI服务(AI Mark),whiteCuda:是否安装CUDA
    ipcMain.handle('install-ai-server', async (_event, whiteCuda: boolean) => {

        logger.info(`安装ai服务,是否包括CUDA：${whiteCuda}`);
        if (whiteCuda) {
            const downloader = new severDownloader();
            downloader.downloadFiles();
        }
        //初始化模型（如果没有会自动拉取）
        await initializeModel();

        // 开始定时拉取CUDA及模型的安装状态
        const intervalId = setInterval(() => {
            logger.info(`检查CUDA和模型安装状态`);
            // 检查CUDA是否安装
            const cudaInstalled = getConfig('cuda_installed');
            // 检查模型是否安装
            const modelInstalled = getConfig('aiModel_installed');
            if (modelInstalled) {
                // 清除定时器
                clearInterval(intervalId);
                logger.info('模型已安装');
                setConfig('ai_server_installed', true, 'boolean');
                sendToRenderer('ai-sever-installed', true);
            }
            if (cudaInstalled && modelInstalled) {
                logger.info('CUDA和模型均已安装');
            }
        }, 3000);
    });
}