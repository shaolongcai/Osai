import { ipcMain, BrowserWindow } from 'electron';
import { updateService } from '../core/updateService.js';
import { logger } from '../core/logger.js';


export function initializeUpdateApi() {

    // 手动检查更新
    ipcMain.handle('check-for-updates', async () => {
        try {
            await updateService.manualCheckForUpdates();
            return true;
        } catch (error) {
            const msg = error instanceof Error ? error.message : '检查更新失败';
            logger.error(`检查更新失败: ${msg}`);
            return false;
        }
    });

    // 手动下载更新包
    ipcMain.handle('download-update', async () => {
        try {
            await updateService.downloadUpdate();
            return true;
        } catch (error) {
            const msg = error instanceof Error ? error.message : '下载更新失败';
            logger.error(`下载更新失败: ${msg}`);
            return false;
        }
    });
}