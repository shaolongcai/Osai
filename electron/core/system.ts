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
import { logger } from './logger.js';
import { getConfig, getDatabase, setConfig } from '../database/sqlite.js';
import { execSync } from 'child_process';
import * as fs from 'fs'
import AdmZip from 'adm-zip';
import path from 'path';
import { getFileTypeByExtension, FileType } from '../units/enum.js';
import { indexSingleFile } from './indexFiles';

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
    // gpuInfo.hasGPU = false //测试CPU时候
    const notification: INotification = {
        id: 'checkGPU',
        text: '检测GPU',
        type: gpuInfo.hasGPU ? 'success' : 'warning',
        tooltip: gpuInfo.hasGPU ? '' : '没有检查到任何可用GPU，将使用CPU进行推理，但速度会有所降低。视觉索引服务将默认关闭'
    }
    logger.info(`检查到的GPU信息:${JSON.stringify(gpuInfo)}`,)
    // 保存是否拥有GPU的配置
    setConfig('hasGPU', gpuInfo.hasGPU, 'boolean')
    // setConfig('hasGPU', false, 'boolean') //测试专用
    sendToRenderer('system-info', notification);

    // 若检查到没有可用的GPU，并且没有过视觉索引的配置,则设置为false
    if (!gpuInfo.hasGPU && getConfig('visual_index_enabled') === undefined) {
        const notification: INotification = {
            id: 'visual-index',
            text: '视觉索引服务已自动关闭',
            type: 'question',
            tooltip: '视觉服务：你可以直接搜索图片中的内容，而不仅是名称。CPU下，索引会较慢，已自动关闭。你可前往【设置】手动开启'
        }
        sendToRenderer('system-info', notification);
        // 设置为false
        setConfig('visual_index_enabled', false, 'boolean')
    }
    else if (gpuInfo.hasGPU && getConfig('visual_index_enabled') === undefined) {
        // 若检查到有可用的GPU，并且没有过视觉索引的配置,则设置为true
        setConfig('visual_index_enabled', true, 'boolean')
    }

    return gpuInfo;
}


/**
 * 检查系统的CUDA版本
 */
export const detectCudaVersion = (): 'cudaV13.zip' | 'cudaV12.zip' => {
    try {
        const nvidiaOutput = execSync('nvidia-smi', { encoding: 'utf8', timeout: 5000 });
        const cudaMatch = nvidiaOutput.match(/CUDA Version: (\d+)\.(\d+)/);

        if (cudaMatch) {
            const majorVersion = parseInt(cudaMatch[1]);
            const minorVersion = parseInt(cudaMatch[2]);

            logger.info(`检测到驱动支持的CUDA版本: ${majorVersion}.${minorVersion}`);

            if (majorVersion >= 13) {
                return 'cudaV13.zip';
            } else if (majorVersion >= 12) {
                return 'cudaV12.zip';
            }
        }
    } catch (error) {
        logger.warn('无法检测CUDA版本，可能未安装CUDA驱动');
    }

    // 默认返回CUDA 12版本
    logger.info('默认使用CUDA 12版本');
    return 'cudaV12.zip';
}


/**
 * 打开某个目录
 * @param type 目录类型
 * @param filePath 目录路径,当type为openFileDir，必须要传入
 * @returns 
 */
export const openDir = async (type: string, filePath?: string) => {
    logger.info(`打开目录: ${type}, ${filePath}`)

    switch (type) {
        // 打开运行日志
        case 'runLog':
            const logsDir = pathConfig.get('logs')
            shell.openPath(logsDir);
            break;
        // 打开所在的文件夹，并且聚焦在该文件上
        case 'openFileDir':
            shell.showItemInFolder(filePath);
            await indexSingleFile(filePath); //索引该文件
            await updateClickCountAndTime(filePath);
            break;
        // 直接打开文件
        case 'openFile':
            shell.openPath(filePath);
            await indexSingleFile(filePath); //索引该文件
            await updateClickCountAndTime(filePath);
            break;
        default:
            break;
    }
}


/**
 * 更新文件点击次数与最后访问时间
 */
const updateClickCountAndTime = async (filePath: string) => {
    try {
        // 异步导入 windowManager
        const { windowManager } = await import('./WindowManager.js');
        if (filePath) {
            const db = getDatabase();
            let formName: string
            if (filePath.endsWith('.app') || filePath.endsWith('.exe')) {
                formName = 'programs'
            } else {
                formName = 'files'
            }
            // 隐藏所有窗口
            windowManager.hideAllWindows();
            db.prepare(`UPDATE ${formName} SET click_count = click_count + 1, last_access_time = datetime('now','localtime') WHERE path = ?`).run(filePath);
            // 打印出当前的次数
            const result = db.prepare(`SELECT click_count FROM ${formName} WHERE path = ?`).get(filePath);
            logger.info(`文件点击次数: ${(result as { click_count: number }).click_count}`);
        }
    } catch (error) {
        logger.warn(`更新文件点击次数失败: ${error}`);
    }
}

/**
    * 公用的解压ZIP文件
    * @param zipPath ZIP文件路径
    * @param extractPath 解压目标路径
    */
export const extractZip = async (zipPath: string, extractPath: string) => {


    logger.info('解压目标路径: ' + extractPath);
    try {
        // 确保目标目录存在
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }

        // 使用 adm-zip 解压
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        logger.info('解压完成');

        try {
            if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
                logger.info(`压缩包已删除: ${zipPath}`);
            }
        } catch (deleteError) {
            logger.warn(`删除压缩包失败: ${deleteError}`);
        }

    } catch (error) {
        const errorMessage = error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error);
        logger.info('解压失败: ' + errorMessage);
        throw new Error('解压失败: ' + errorMessage);
    }
}


/**
 * 检查CUDA解压包
 * @returns 压缩包路径和解压路径
 */
//解压CUDA服务
export const extractCUDA = async () => {
    // 检查是否有cuda.zip文件
    const cudaDir = path.join(pathConfig.get('resources'), 'Ollama', 'lib', 'ollama');
    const v12ZipPath = path.join(cudaDir, 'cudaV12.zip');
    const v13ZipPath = path.join(cudaDir, 'cudaV13.zip');
    // 判断文件是否存在，而不是判断路径字符串是否存在
    if (fs.existsSync(v12ZipPath)) {
        logger.info(`发现CUDA V12压缩包: ${v12ZipPath}`);
        await extractZip(v12ZipPath, cudaDir);
    } else if (fs.existsSync(v13ZipPath)) {
        logger.info(`发现CUDA V13压缩包: ${v13ZipPath}`);
        await extractZip(v13ZipPath, cudaDir);
    }
    else {
        logger.info(`未发现CUDA V12或V13压缩包`);
    }
}


/**
 * 寻找所有最近访问目录的路径
 * @returns 最近访问目录的路径数组
 */
export const findRecentFolders = (): string[] => {
    const recentPaths: string[] = [];
    const recentFolder = pathConfig.get('recentFolder');
    // 尝试打开最近访问文件夹
    try {
        const entries = fs.readdirSync(recentFolder, { withFileTypes: true });
        const shortcutFiles = entries
            .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.lnk'))
            .map(e => path.join(recentFolder, e.name));

        if (shortcutFiles.length === 0) {
            logger.info('最近访问列表为空或未检测到 .lnk 文件');
            return [];
        }

        //筛选出文档以及路径有效的快捷方式
        for (const lnkPath of shortcutFiles) {
            let targetPath: string | undefined;
            try {
                const link = shell.readShortcutLink(lnkPath);
                targetPath = link?.target;
                if (!targetPath) continue;
                // 判断类型（图片/文档/其他）
                const ext = path.extname(targetPath).toLowerCase();
                const fileType = getFileTypeByExtension(ext);
                if (fileType === FileType.Image) {
                    recentPaths.push(targetPath);
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : '解析快捷方式失败';
                logger.warn(`${msg}: ${lnkPath}`);
                continue;
            }
        }
        return recentPaths
    }
    catch (error) {
        logger.warn(`读取最近访问文件夹失败: ${error}`);
        return [];
    }
}



const buildMarkdownContent = (data: any) => {
    let content = `Osai 报错\n`;
    for (const [key, value] of Object.entries(data)) {
        content += `> ${key}:<font color="comment">${value}</font>\n`;
    }
    return content;
};


/**
 * 向企业微信报告错误
 * 联网时报告
 */
export const reportErrorToWechat = async (error: any) => {

    try {
        logger.info(`用户是否同意报告,${getConfig('report_agreement')}`);
        //查看用户是否允许上传系统信息
        if (getConfig('report_agreement') !== true) {
            return;
        }

        const systemInfo = {
            platform: os.platform(),        // 操作系统平台 (win32, darwin, linux)
            arch: os.arch(),                // CPU架构 (x64, arm64, ia32)
            release: os.release(),          // 系统版本号
            version: os.version(),          // 系统版本详细信息
            cpus: os.cpus().length,         // CPU核心数
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // 总内存(GB)
            freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),   // 可用内存(GB)
        };

        // 2. 获取更详细的系统信息（可选）
        const detailedInfo = await si.osInfo();
        const windowsVersion = {
            distro: detailedInfo.distro,           // Windows 10, Windows 11 等
            release: detailedInfo.release,         // 版本号
            codename: detailedInfo.codename,       // 代号
            platform: detailedInfo.platform,      // 平台
            arch: detailedInfo.arch                // 架构
        };

        const enhancedError = {
            ...error,
            systemInfo: JSON.stringify(systemInfo),
            WindowsVersion: JSON.stringify(windowsVersion),
        };

        const params = {
            "msgtype": "markdown",
            "markdown": {
                "content": buildMarkdownContent(enhancedError)
            }
        };
        const url = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=dbb06a64-caa9-4c40-bc30-5d7aa0f5e25d'
        //代理服务器
        const sendUrl = 'http://ai-lib.timefamily.cc:10090/common/proxy/post?url=' + encodeURIComponent(url);
        await fetch(sendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });
    } catch (error) {
        logger.error(`报告错误到企业微信失败: ${error}`);
    }
}