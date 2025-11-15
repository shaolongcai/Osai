import { ipcMain, app, shell } from 'electron';
import { logger } from '../core/logger.js';
import { severDownloader } from '../core/downloader.js';
import { initializeModel } from '../core/model.js';
import { getAllConfigs, getConfig, setConfig } from '../database/sqlite.js';
import { sendToRenderer } from '../main.js';


export function initializeSystemApi() {

    // 获取用户配置
    ipcMain.handle('get-config', (_event, key?: string) => { return key ? getConfig(key) : getAllConfigs() })
    // 设置用户配置
    ipcMain.handle('set-config', (_event, key: string, value: any, type?: string) => { setConfig(key, value, type) })

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

        // 开始定时拉取模型的安装状态(模型安装完毕时AI-mark即可用)
        const intervalId = setInterval(() => {
            // 检查CUDA是否安装
            // const cudaInstalled = getConfig('cuda_installed');
            // 检查模型是否安装
            const modelInstalled = getConfig('aiModel_installed');
            if (modelInstalled) {
                // 清除定时器
                clearInterval(intervalId);
                logger.info('模型已安装');
                sendToRenderer('ai-sever-installed', true);
            }
        }, 3000);
    });

    // 獲取自啟動狀態
    ipcMain.handle('get-auto-launch', (_event) => {
        try {
            const loginItemSettings = app.getLoginItemSettings();
            const enabled = loginItemSettings.openAtLogin;
            logger.info(`獲取自啟動狀態: ${enabled}`);
            return enabled;
        } catch (error) {
            logger.error(`獲取自啟動狀態失敗: ${error}`);
            return false;
        }
    });

    // 設置自啟動狀態
    ipcMain.handle('set-auto-launch', (_event, enabled: boolean) => {
        try {
            app.setLoginItemSettings({
                openAtLogin: enabled,
                openAsHidden: false,
            });
            // 保存到數據庫
            setConfig('autoLaunch', enabled, 'boolean');
            logger.info(`設置自啟動狀態: ${enabled}`);
            return true;
        } catch (error) {
            logger.error(`設置自啟動狀態失敗: ${error}`);
            return false;
        }
    });

    // 在外部瀏覽器中打開鏈接
    ipcMain.handle('open-external-url', (_event, url: string) => {
        try {
            shell.openExternal(url);
            logger.info(`在外部瀏覽器中打開鏈接: ${url}`);
            return true;
        } catch (error) {
            logger.error(`打開外部鏈接失敗: ${error}`);
            return false;
        }
    });
}