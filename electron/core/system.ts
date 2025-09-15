/**
 * 管理系统相关
 */
import * as os from 'os';
import si from 'systeminformation';
import { shell } from 'electron';
import { GPUInfo } from '../types/system';
import { sendToRenderer } from '../main.js';
import { INotification } from '../types/system.js';
import pathConfig from './pathConfigs.js';
import { exec } from 'child_process';

/**
 * 检查系统是否有可用的GPU
 */
const checkGPUInfo = async (): Promise<GPUInfo> => {
    try {
        const graphics = await si.graphics();
        const platform = os.platform();
        const arch = os.arch();

        const gpuInfo = {
            hasGPU: false,
            memory: 0,
            hasDiscreteGPU: false,
        };

        if (graphics && graphics.controllers) {

            for (const gpu of graphics.controllers) {
                // 检查是否为Apple Silicon Mac（统一内存架构）
                if (
                    platform === 'darwin' &&
                    arch === 'arm64' &&
                    gpu.model &&
                    gpu.model.toLowerCase().includes('apple')
                ) {
                    gpuInfo.hasGPU = true
                    // Apple Silicon 架构特殊，可认为其集成的 GPU 性能强劲
                    gpuInfo.hasDiscreteGPU = true
                    const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024)
                    const availableMemoryMB = Math.round(totalMemoryGB * 0.7 * 1024)
                    gpuInfo.memory = availableMemoryMB
                    break // Apple Silicon 只需要检测一次
                } else if (gpu.vram && gpu.vram > 0) {
                    // 3. 处理传统独立显卡或集成显卡
                    gpuInfo.hasGPU = true
                    const memoryMB = gpu.vram // systeminformation 返回的单位已经是 MB

                    // a. 通过 vendor 判断是否为独立显卡
                    const vendor = gpu.vendor.toLowerCase()
                    if (vendor.includes('nvidia') || vendor.includes('amd')) {
                        gpuInfo.hasDiscreteGPU = true
                    }

                    // 记录大的显存，这确保了在有集显+独显的系统中，我们记录的是独显的显存
                    if (memoryMB > gpuInfo.memory) {
                        gpuInfo.memory = memoryMB
                    }
                }
            }
        }

        return gpuInfo;
    } catch (error) {
        // this.logger.error(`GPU检测失败: ${error.message}`);
        return { hasGPU: false, memory: 0, hasDiscreteGPU: false };
    }
}



/**
 * 检查系统是否有可用的GPU
 * @returns 
 */
export const checkGPU = async (): Promise<GPUInfo> => {
    const gpuInfo = await checkGPUInfo();
    gpuInfo.hasGPU = false //测试CPU时候
    const notification: INotification = {
        id: 'checkGPU',
        text: '检测GPU',
        type: gpuInfo.hasGPU ? 'success' : 'warning',
        tooltip: gpuInfo.hasGPU ? '' : '没有检查到任何可用GPU，将使用CPU进行推理，但速度会有所降低。视觉索引服务将默认关闭'
    }
    console.log('检查到的GPU信息', gpuInfo)
    sendToRenderer('system-info', notification);

    // 若检查到没有可用的GPU，提示用户视觉服务已关闭
    // if (!gpuInfo.hasGPU) {
    //     const notification: INotification = {
    //         id: 'visual-index',
    //         text: '视觉服务已关闭',
    //         type: 'question',
    //         tooltip: '视觉服务：你可以直接搜索图片中的内容，而不仅是名称。CPU下，索引会较慢，已自动关闭。你可前往【设置】手动开启'
    //     }
    //     sendToRenderer('system-info', notification);
    // }

    return gpuInfo;
}



/**
 * 打开某个目录
 * @param type 目录类型
 * @param filePath 目录路径,当type为openFileDir，必须要传入
 * @returns 
 */
export const openDir = (type: string, filePath?: string) => {
    switch (type) {
        // 打开运行日志
        case 'runLog':
            const logsDir = pathConfig.get('logs')
            shell.openPath(logsDir);
            break;
        case 'openFileDir':
            if (process.platform === 'win32') {
                // 在 Windows 上，使用 explorer.exe 并通过 /select 参数来选中文件
                exec(`explorer.exe /select,"${filePath}"`);
            } else if (process.platform === 'darwin') {
                // 在 macOS 上，使用 open 命令并附带 -R 参数来在 Finder 中显示文件
                exec(`open -R "${filePath}"`);
            } else {
                // 对于其他平台（如 Linux），继续使用 showItemInFolder 作为备选
                shell.showItemInFolder(filePath);
            }
            break;
        default:
            break;
    }
}