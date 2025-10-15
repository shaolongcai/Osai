import pkg from 'electron-updater'
import { app, dialog } from 'electron';
import { logger } from './logger.js';
import { sendToRenderer } from '../main.js';
import { INotification } from '../types/system.js';


const { autoUpdater } = pkg;
class UpdateService {

    private isUpdating = false;

    constructor() {
        this.setupAutoUpdater();
    }


    /**
     * 步骤2：配置自动更新器
     */
    private setupAutoUpdater(): void {
        // 设置日志
        autoUpdater.logger = logger;
        // 禁用差异更新，强制完整下载(暂时)
        autoUpdater.disableDifferentialDownload = true;
        // 禁用自动下载，只检查更新
        autoUpdater.autoDownload = false;

        // 强制开发环境也进行更新检查（仅用于测试）
        if (process.env.NODE_ENV === 'development') {
            autoUpdater.forceDevUpdateConfig = true;
            // 或者设置更新服务器地址
            // autoUpdater.setFeedURL({
            //     provider: 'generic',
            //     url: 'http://t420e4d1q.hd-bkt.clouddn.com/V1.0-test/'
            // });
        }

        // 监听更新事件
        autoUpdater.on('checking-for-update', () => {
            logger.info('正在检查更新...');
            // sendToRenderer('update-status', { type: 'checking', message: '正在检查更新...' });
        });

        autoUpdater.on('update-available', (info) => {
            logger.info(`发现新版本: ${info.version}`);
            sendToRenderer('update-status', {
                version: info.version,
                releaseNotes: info.releaseNotes,
                releaseDate: info.releaseDate,
                isUpdateAvailable: true
            });
        });

        autoUpdater.on('update-not-available', () => {
            logger.info('当前已是最新版本');
            sendToRenderer('update-status', { isUpdateAvailable: false, message: '当前已是最新版本' });
        });



        autoUpdater.on('error', (error) => {
            const msg = error instanceof Error ? error.message : '更新检查失败';
            logger.error(`更新错误: ${msg}`);
            sendToRenderer('update-status', { isUpdateAvailable: false, message: msg });
        });

        autoUpdater.on('download-progress', (progressObj) => {
            const message = `下载进度: ${Math.round(progressObj.percent)}%`;
            logger.info(`update-${message}`);
            const notification: INotification = {
                id: 'download-progress',
                text: message,
                type: 'loading',
                tooltip: '下载完成后需要重启应用'
            }
            sendToRenderer('system-info', notification);
        });

        autoUpdater.on('update-downloaded', () => {
            logger.info('更新下载完成');
            const notification: INotification = {
                id: 'download-progress',
                text: '更新下载完成，准备安装',
                type: 'success',
            }
            sendToRenderer('system-info', notification);
            // 显示重启对话框
            this.showRestartDialog();
        });
    }

    /**
     * 步骤3：检查更新
     */
    async checkForUpdates(): Promise<void> {
        if (this.isUpdating) {
            logger.warn('更新检查已在进行中');
            return;
        }

        try {
            this.isUpdating = true;
            await autoUpdater.checkForUpdatesAndNotify();
        } catch (error) {
            const msg = error instanceof Error ? error.message : '检查更新失败';
            logger.error(`检查更新失败: ${msg}`);
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * 步骤4：开始下载更新
     */
    async downloadUpdate(): Promise<void> {
        try {
            logger.info('开始下载更新...');
            await autoUpdater.downloadUpdate();
        } catch (error) {
            const msg = error instanceof Error ? error.message : '下载更新失败';
            logger.error(`下载更新失败: ${msg}`);
        }
    }

    /**
     * 步骤5：安装更新并重启
     */
    installAndRestart(): void {
        logger.info('安装更新并重启应用');

        //      const windows = BrowserWindow.getAllWindows();
        // windows.forEach(window => {
        //     if (!window.isDestroyed()) {
        //         window.destroy();
        //     }
        // });

        // todo：setTimeout，确保窗口销毁再进行
        autoUpdater.quitAndInstall(false, true); //第一个参数不显示安装界面，第二个界面后台静默安装
    }

    /**
     * 步骤6：显示重启确认对话框
     */
    private async showRestartDialog(): Promise<void> {
        const result = await dialog.showMessageBox({
            type: 'info',
            title: '更新完成',
            message: '新版本已下载完成，是否立即重启应用以完成更新？',
            buttons: ['立即重启', '稍后重启'],
            defaultId: 0,
            cancelId: 1
        });

        if (result.response === 0) {
            // @todo： 下个版本尝试注释这个
            this.installAndRestart();
        }
    }

    /**
     * 手动触发检查更新
     */
    async manualCheckForUpdates(): Promise<void> {
        try {
            const result = await autoUpdater.checkForUpdates();
            if (!result?.updateInfo) {
                sendToRenderer('update-status', { type: 'not-available', message: '当前已是最新版本' });
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : '检查更新失败';
            throw new Error(msg)
        }
    }
}

export const updateService = new UpdateService();