import pathConfig from './pathConfigs.js';
import * as path from 'path'
import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'
import { logger } from './logger.js'
import { INotification } from '../types/system.js';
import { sendToRenderer } from '../main.js';
import AdmZip from 'adm-zip';
import { setConfig } from '../database/sqlite.js';
import { detectCudaVersion, extractZip } from './system.js';


interface DownloadTask {
    url: string
    filename: string
    tempPath: string
    finalPath: string
}
/**
 * CUDA服务下载器
 */
export class severDownloader {
    private cudaDir: string
    private tempDir: string

    constructor() {
        this.cudaDir = path.join(pathConfig.get('resources'), 'Ollama', 'lib', 'ollama')
        this.tempDir = path.join(this.cudaDir, '__temp__')

        // 确保目录存在
        if (!fs.existsSync(this.cudaDir)) {
            fs.mkdirSync(this.cudaDir, { recursive: true })
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

                        if (progress !== lastProgress && progress % 5 === 0) {
                            logger.info(`${task.filename} 下载进度: ${progress}%`)
                            // 发送进度
                            const notification: INotification = {
                                id: 'downloadGpuSever',
                                text: `正在下载GPU加速服务 ${progress}%`,
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
                        // 清理临时目录
                        this.cleanupTempDir()
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
     * 并发下载多个文件
     * 暂时只下载CUDA文件
     */
    async downloadFiles(): Promise<boolean> {

        try {
            // 检查CUDA版本
            const cudaVersion = detectCudaVersion()

            // 开始时间
            const startTime = Date.now()

            const baseUrl = 'http://t420e4d1q.hd-bkt.clouddn.com/' //CUDA下载的url，七牛服务
            const files = [cudaVersion]

            // 准备下载任务
            const tasks: DownloadTask[] = files.map(filename => ({
                url: baseUrl + filename,
                filename,
                tempPath: path.join(this.tempDir, filename),
                finalPath: path.join(this.cudaDir, filename)
            }))

            // 确认是否已经存在，存在则不需要重新下载zip包
            const pendingTasks = tasks.filter(t => !fs.existsSync(t.finalPath))

            if (pendingTasks.length > 0) {
                logger.info('CUDA服务已安装，无需重新下载')
                // 并发下载
                const downloadPromises = pendingTasks.map(task => this.downloadFile(task))
                const results = await Promise.all(downloadPromises)
                const successCount = results.filter(result => result).length

                if (successCount === pendingTasks.length) {
                    // 计算下载时间
                    const endTime = Date.now()
                    const downloadTime = (endTime - startTime) / 1000 // 转换为秒
                    logger.info(`CUDA服务下载完成！下载耗时: ${downloadTime.toFixed(2)} 秒`)
                    // 清理临时目录
                    this.cleanupTempDir()

                } else {
                    logger.error(`部分文件下载失败，成功: ${successCount}/${pendingTasks.length}`)
                    return false
                }
            }

            // 解压ZIP文件
            const notification: INotification = {
                id: 'downloadGpuSever',
                text: 'CUDA服务正在解压...',
                type: 'loading',
            }
            sendToRenderer('system-info', notification)
            const zipPath = path.join(this.cudaDir, files[0])
            extractZip(zipPath, this.cudaDir)
            //记录配置，并且清除压缩包
            setConfig('cuda_installed', true, 'boolean');
            setConfig('cuda_version', '12.0', 'string');
            // 解压成功
            const notification2: INotification = {
                id: 'downloadGpuSever',
                text: 'CUDA服务已就绪',
                type: 'success',
                tooltip: '请重启应用，以便CUDA服务生效'
            }
            sendToRenderer('system-info', notification2)
            return true
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'CUDA服务解压失败';
            logger.error(`CUDA服务解压失败: ${msg}`);
            const notification: INotification = {
                id: 'downloadGpuSever',
                text: 'CUDA服务解压失败,请重试',
                type: 'warning',
                tooltip: '你可以重新尝试安装GPU服务，可以重新解压'
            }
            sendToRenderer('system-info', notification)
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