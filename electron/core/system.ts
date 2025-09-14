/**
 * 管理系统相关
 */
import * as os from 'os';
import si from 'systeminformation';
import { GPUInfo } from '../types/system';
import { sendToRenderer } from '../main.js';
import { INotification } from '../types/system.js';


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

        // gpuInfo.hasGPU = false //测试CPU时候
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
    const notification: INotification = {
        id: 'checkGPU',
        text: '检测到GPU',
        type: gpuInfo.hasGPU ? 'success' : 'warning',
        tooltip: gpuInfo.hasGPU ? '' : '没有检查到任何可用GPU，将使用CPU进行推理，但速度会有所降低'
    }
    console.log('检查到的GPU信息', gpuInfo)
    sendToRenderer('system-info', notification);

    // 若检查到没有可用的GPU，提示用户视觉服务已关闭
    if (!gpuInfo.hasGPU) {
        const notification: INotification = {
            id: 'visual-index',
            text: '视觉服务已关闭',
            type: 'question',
            tooltip: '视觉服务：你可以直接搜索图片中的内容，而不仅是名称。CPU下，索引会较慢，已自动关闭。你可前往【设置】手动开启'
        }
        sendToRenderer('system-info', notification);
    }

    return gpuInfo;
}