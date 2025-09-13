/**
 * 管理系统相关
 */
import * as os from 'os';
import si from 'systeminformation';
import { GPUInfo } from '../types/system';


/**
 * 检查系统是否有可用的GPU
 */
export const checkGPUInfo = async (): Promise<GPUInfo> => {
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