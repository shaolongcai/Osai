import { logger } from './logger.js'
import pathConfig from './pathConfigs.js';
import * as path from 'path'
import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'
import { INotification } from '../types/system.js';
import { sendToRenderer } from '../main.js';
import { setModelReady } from './appState.js';
import { ollamaService } from './ollama.js'
import ollama from 'ollama'

/**
 * 初始化并加载AI模型到内存中。
 * 这个函数在整个应用生命周期中只应被调用一次。
 */
export async function initializeModel() {
    // 如果模型已经加载，则直接返回，防止重复加载
    try {
        logger.info('启动Ollama AI服务...');

        // 启动Ollama服务
        await ollamaService.start();

        // 检查模型是否存在
        const modelExists = await listOllamaModels();
        if (!modelExists) {
            logger.info(`模型 qwen2.5vl:3b 不存在，开始拉取...`);
            await pullOllamaModel('qwen2.5vl:3b');
        }

        logger.info('AI模型已成功初始化');
        const notification: INotification = {
            id: 'downloadModel',
            text: 'AI服务已就绪',
            type: 'success',
        }
        sendToRenderer('system-info', notification)

        setModelReady(true);

    } catch (error) {
        const msg = error instanceof Error ? error.message : '模型初始化失败';
        logger.error(`模型初始化失败: ${msg}`);
        throw new Error(msg);
    }
}


// 从远端或本地添加模型
async function pullOllamaModel(modelName: string): Promise<void> {

    return new Promise(async (resolve, reject) => {
        try {

            logger.info(`开始拉取模型: ${modelName}`);

            const response = await ollama.pull({
                model: modelName,
                stream: true,
            })

            let lastProgress: number
            // 步骤1：处理流式响应数据
            for await (const part of response) {
                // 步骤2：显示下载进度
                if (part.completed && part.total) {
                    const progress = ((part.completed / part.total) * 100).toFixed(1);
                    // 显示进度（每1%显示一次）
                    if (Number(progress) % 2 === 0 && Number(progress) !== lastProgress) {
                        lastProgress = Number(progress)
                        logger.info(`下载进度: ${progress}%`);
                        // 发送进度
                        const notification: INotification = {
                            id: 'downloadModel',
                            text: `正在下载AI模型 ${Math.floor(Number(progress))}%`,
                            type: 'loading',
                            tooltip: '在AI模型下载完成前，你还可以使用传统搜索'
                        }
                        sendToRenderer('system-info', notification)
                    }

                }
            }

            // 步骤3：流处理完成后才记录完成日志
            logger.info(`模型 ${modelName} 拉取完成`);

            resolve()

        } catch (error) {
            const msg = error instanceof Error ? error.message : '模型拉取失败';
            logger.error(`模型拉取失败: ${msg}`);
            reject(new Error(msg));
        }
    })
}

// 列出模型检查
async function listOllamaModels(): Promise<boolean> {
    try {
        const response = await ollama.list();
        // logger.info(`当前可用模型: ${JSON.stringify(response.models, null, 2)}`);
        return response.models.some(model => model.name === 'qwen2.5vl:3b');
    } catch (error) {
        const msg = error instanceof Error ? error.message : '模型列表获取失败';
        logger.error(`模型列表获取失败: ${msg}`);
        throw new Error(msg);
    }
}



interface DownloadTask {
    url: string
    filename: string
    tempPath: string
    finalPath: string
}
/**
 * 模型下载器
 */
export class ModelDownloader {
    private modelsDir: string
    private tempDir: string
    private modelProgress: number
    private mmprojProgress: number

    constructor() {
        this.modelsDir = pathConfig.get('models')
        this.tempDir = path.join(this.modelsDir, '__temp__')
        this.modelProgress = 0
        this.mmprojProgress = 0

        // 确保目录存在
        if (!fs.existsSync(this.modelsDir)) {
            fs.mkdirSync(this.modelsDir, { recursive: true })
        }
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true })
        }
    }

    private async downloadFile(task: DownloadTask): Promise<boolean> {
        return new Promise((resolve) => {
            this.downloadWithRedirect(task, resolve, 0)
        })
    }

    /**
     * 下载单个文件（支持断点续传）
     */
    private async downloadWithRedirect(task: DownloadTask, resolve: (value: boolean) => void, redirectCount: number): Promise<boolean> {

        // 防止无限重定向
        if (redirectCount > 5) {
            logger.error(`重定向次数过多: ${task.filename}`)
            resolve(false)
            return
        }

        try {
            // 检查临时文件是否存在（断点续传）
            let startByte = 0
            if (fs.existsSync(task.tempPath)) {
                startByte = fs.statSync(task.tempPath).size
                logger.info(`断点续传: ${task.filename}, 从 ${startByte} 字节开始`)
            }

            const headers: http.OutgoingHttpHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            };
            const protocol = task.url.startsWith('https:') ? https : http
            if (startByte > 0) {
                headers['Range'] = `bytes=${startByte}-`;
            }
            const options = { headers };

            const request = protocol.get(task.url, options, (response) => {

                // 处理重定向
                if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                    const redirectUrl = response.headers.location
                    if (redirectUrl) {
                        logger.info(`重定向: ${task.filename} -> ${redirectUrl}`)
                        // 更新任务URL并重新下载
                        const newTask = { ...task, url: redirectUrl }
                        this.downloadWithRedirect(newTask, resolve, redirectCount + 1)
                        return
                    } else {
                        logger.error(`重定向失败，无location头: ${task.filename}`)
                        resolve(false)
                        return
                    }
                }


                if (response.statusCode !== 200 && response.statusCode !== 206) {
                    logger.error(`下载失败: ${task.filename}, 状态码: ${response.statusCode}`)
                    resolve(false)
                    return
                }

                const totalSize = parseInt(response.headers['content-length'] || '0') + startByte
                let downloadedSize = startByte
                let lastProgress = -1

                // 创建写入流（追加模式用于断点续传）
                const writeStream = fs.createWriteStream(task.tempPath, { flags: 'a' })

                response.on('data', (chunk) => {
                    downloadedSize += chunk.length

                    // 显示进度（每10%显示一次）
                    if (totalSize > 0) {
                        const progress = Math.floor((downloadedSize / totalSize) * 100)
                        // 模型文件
                        if (task.filename.startsWith('Qwen2.5')) {
                            this.modelProgress = progress
                        }
                        // mmproj文件
                        else if (task.filename.startsWith('mmproj')) {
                            this.mmprojProgress = progress
                        }
                        if (progress !== lastProgress && progress % 5 === 0) {
                            logger.info(`${task.filename} 下载进度: ${progress}%`)
                            // 计算总进度，并且去掉小数
                            const totalProgress = Math.floor((this.modelProgress + this.mmprojProgress) / 2)
                            // 发送进度
                            const notification: INotification = {
                                id: 'downloadModel',
                                text: `正在下载AI模型 ${totalProgress}%`,
                                type: 'loading',
                            }
                            sendToRenderer('system-info', notification)
                            lastProgress = progress
                        }
                    }
                })

                response.on('end', () => {
                    writeStream.end()

                    // 下载完成，移动到最终位置
                    try {
                        fs.renameSync(task.tempPath, task.finalPath)
                        logger.info(`下载完成: ${task.filename}`)
                        resolve(true)
                    } catch (error) {
                        logger.error(`移动文件失败: ${error}`)
                        resolve(false)
                    }
                })

                response.on('error', (error) => {
                    logger.error(`下载错误: ${task.filename}, ${error.message}`)
                    writeStream.destroy()
                    resolve(false)
                })

                response.pipe(writeStream, { end: false })
            })

            request.on('error', (error) => {
                logger.error(`请求错误: ${task.filename}, ${error.message}`)
                resolve(false)
            })

            // request.setTimeout(30000, () => {
            //     request.destroy()
            //     logger.error(`下载超时: ${task.filename}`)
            //     resolve(false)
            // })

        } catch (error) {
            logger.error(`下载异常: ${task.filename}, ${error}`)
            resolve(false)
        }
    }

    /**
     * 并发下载多个模型文件
     */
    async downloadModels(): Promise<boolean> {
        const baseUrl = 'https://modelscope.cn/models/lmstudio-community/Qwen2.5-VL-3B-Instruct-GGUF/resolve/master/'
        const files = [
            'Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf',
            'mmproj-model-f16.gguf'
        ]

        // 准备下载任务
        const tasks: DownloadTask[] = files.map(filename => ({
            url: baseUrl + filename,
            filename,
            tempPath: path.join(this.tempDir, filename),
            finalPath: path.join(this.modelsDir, filename)
        }))

        // 过滤已存在的文件
        const pendingTasks = tasks.filter(task => {
            if (fs.existsSync(task.finalPath)) {
                logger.info(`文件已存在，跳过: ${task.filename}`)
                // 模型文件
                if (task.filename.startsWith('Qwen2.5')) {
                    this.modelProgress = 100
                }
                // mmproj文件
                else if (task.filename.startsWith('mmproj')) {
                    this.mmprojProgress = 100
                }
                return false
            }
            return true
        })

        if (pendingTasks.length === 0) {
            logger.info('所有模型文件已存在！')
            const notification: INotification = {
                id: 'downloadModel',
                text: 'AI服务已就绪',
                type: 'success',
            }
            sendToRenderer('system-info', notification)
            setModelReady(true)
            return true
        }

        logger.info(`开始下载 ${pendingTasks.length} 个文件...`)

        // 并发下载
        const downloadPromises = pendingTasks.map(task => this.downloadFile(task))
        const results = await Promise.all(downloadPromises)

        const successCount = results.filter(result => result).length

        if (successCount === pendingTasks.length) {
            logger.info('所有模型文件下载完成！')
            // 发送通知
            const notification: INotification = {
                id: 'downloadModel',
                text: 'AI服务已就绪',
                type: 'success',
            }
            sendToRenderer('system-info', notification)
            setModelReady(true)
            // 清理临时目录
            this.cleanupTempDir()
            return true
        } else {
            logger.error(`部分文件下载失败，成功: ${successCount}/${pendingTasks.length}`)
            return false
        }
    }

    /**
     * 清理临时目录
     */
    private cleanupTempDir() {
        try {
            if (fs.existsSync(this.tempDir)) {
                const files = fs.readdirSync(this.tempDir)
                for (const file of files) {
                    fs.unlinkSync(path.join(this.tempDir, file))
                }
                fs.rmdirSync(this.tempDir)
                logger.info('临时目录清理完成')
            }
        } catch (error) {
            logger.error(`清理临时目录失败: ${error}`)
        }
    }
}
