// 步骤1：创建Ollama管理器
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { logger } from './logger.js';
import { fileURLToPath } from 'url';
import pathConfig from './pathConfigs.js';
import { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


class OllamaService {
    private process: ChildProcess | null = null;
    private isRunning = false;
    private ollamaPath: string;
    private imageWorker: Worker | null = null;
    private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();

    constructor() {
        // Ollama可执行文件路径
        this.ollamaPath = pathConfig.get('ollamaPath');
        // this.initializeImageWorker();
    }

    // 启动Ollama服务
    async start(): Promise<void> {
        if (this.isRunning) return;

        // 重试机制，最多重试3次
        const maxRetries = 3;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                //启动前，清理所有进程
                await this.killAllOllamaProcesses();

                //区分win与mac启动
                const platform = process.platform;
                let spawnArgs: string[];
                let spawnCommand: string;

                if (platform === 'win32') {
                    const elevatePath = path.join(pathConfig.get('resources'), 'elevate.exe');
                    spawnCommand = elevatePath;
                    spawnArgs = [this.ollamaPath, 'serve'];
                } else {
                    // macOS 和 Linux 直接启动
                    spawnCommand = this.ollamaPath;
                    spawnArgs = ['serve'];
                }


                this.process = spawn(spawnCommand, spawnArgs, {
                    stdio: 'pipe',
                    env: {
                        ...process.env,
                        OLLAMA_HOST: '127.0.0.1:11434',
                        OLLAMA_REGISTRY: 'https://docker.mirrors.ustc.edu.cn',   //国内专用中科大镜像
                        // 降低资源占用
                        OLLAMA_MAX_LOADED_MODELS: '1',
                        OLLAMA_NUM_PARALLEL: '1',
                        // 启用调试日志
                        OLLAMA_DEBUG: '1',
                        OLLAMA_LOG_LEVEL: 'debug'
                    }
                });

                const processErrorPromise = new Promise((_, reject) => {
                    this.process.on('error', (error) => {
                        const msg = error instanceof Error ? error.message : 'Ollama启动失败';
                        logger.error(`Ollama启动失败: ${msg}`);
                        reject(new Error(msg));
                    });
                });

                // 等待服务就绪或进程错误
                await Promise.race([
                    this.waitForReady(),
                    processErrorPromise
                ]);

                this.isRunning = true;
                logger.info('Ollama服务启动成功');
                return // 成功后退出循环
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Ollama启动失败';
                lastError = new Error(msg);
                logger.error(`Ollama服务启动失败: ${msg}`);

                // 如果不是最后一次尝试，等待一段时间后重试
                if (attempt < maxRetries) {
                    const waitTime = attempt * 1000; // 递增等待时间：1秒、2秒
                    logger.info(`等待${waitTime}ms后重试...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime)); //等待的函数

                    // 重试前清理进程
                    await this.killAllOllamaProcesses();
                }
            }
        }
        // 3次重试失败，抛出最后一个错误
        const finalMsg = lastError?.message || 'Ollama启动失败';
        logger.error(`Ollama启动失败，已重试${maxRetries}次: ${finalMsg}`);
        throw new Error(`Ollama启动失败，已重试${maxRetries}次: ${finalMsg}`);
    }


    // 等待服务就绪
    private async waitForReady(): Promise<void> {
        for (let i = 0; i < 30; i++) {
            try {
                const response = await fetch('http://127.0.0.1:11434/api/tags');
                if (response.ok) return;
            } catch { }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error('Ollama服务启动超时');
    }

    // 重启 Worker
    private restartImageWorker(): void {
        try {
            // 清理所有待处理的请求
            for (const [requestId, pending] of this.pendingRequests) {
                pending.reject(new Error('Worker重启，请求被取消'));
            }
            this.pendingRequests.clear();

            // 关闭旧的Worker
            if (this.imageWorker) {
                this.imageWorker.terminate();
                this.imageWorker = null;
            }

            // 重新初始化Worker
            setTimeout(() => {
                this.initializeImageWorker();
            }, 1000); // 延迟1秒重启

        } catch (error) {
            // logger.error(`重启图像处理 Worker 失败: ${error}`);
        }
    }

    // 初始化图像处理 Worker
    private initializeImageWorker(): void {
        try {
            const workerPath = path.join(__dirname, 'imageProcessor.worker.js');
            this.imageWorker = new Worker(workerPath);

            // 监听 Worker 消息
            this.imageWorker.on('message', (response: any) => {
                const { requestId, success, result, error } = response;
                console.log('result', result)
                const pending = this.pendingRequests.get(requestId);

                if (pending) {
                    this.pendingRequests.delete(requestId);
                    if (success) {
                        pending.resolve(result);
                    } else {
                        pending.reject(new Error(error));
                    }
                }
            });

            // 监听 Worker 错误
            this.imageWorker.on('error', (error) => {
                // logger.error(`图像处理 Worker 错误: ${error.message}`);
                // 重启 Worker
                this.restartImageWorker();
            });

            // 监听 Worker 退出
            this.imageWorker.on('exit', (code) => {
                if (code !== 0) {
                    // logger.warn(`图像处理 Worker 异常退出，代码: ${code}`);
                    this.restartImageWorker();
                }
            });

        } catch (error) {
            // logger.error(`初始化图像处理 Worker 失败: ${error}`);
        }
    }


    //  使用线程来获取图片摘要
    //    async processImage(imagePath: string, prompt: string = '请使用中文摘要这张图片，请简洁描述，不要重复内容，控制在300字以内'): Promise<string> {
    //     return new Promise((resolve, reject) => {
    //         const fileName = path.basename(imagePath);
    //         //跳过名称
    //         const skipNames = ['企业微信截图', '截图', '公司', '充值方案', '图片详情', '图片信息', '图片详情']
    //         if (skipNames.some(name => fileName.includes(name))) {
    //             console.log(`跳过名称: ${fileName}`)
    //             resolve('');
    //             return;
    //         }

    //         if (!this.imageWorker) {
    //             reject(new Error('图像处理 Worker 未初始化'));
    //             return;
    //         }

    //         const requestId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    //         // 存储 Promise 的 resolve 和 reject
    //         this.pendingRequests.set(requestId, { resolve, reject });

    //         // 发送任务到 Worker
    //         this.imageWorker.postMessage({
    //             imagePath,
    //             prompt,
    //             requestId
    //         });
    //     });
    // }

    // 生成文本
    async generate(model: string, prompt: string): Promise<string> {
        try {
            const response = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt, stream: false })
            });

            if (!response.ok) {
                throw new Error(`生成失败: ${response.statusText}`);
            }

            const data = await response.json();
            return data.response;

        } catch (error) {
            const msg = error instanceof Error ? error.message : '生成失败';
            logger.error(`生成失败: ${msg}`);
            throw new Error(msg);
        }
    }

    // 停止服务
    stop(): void {
        if (this.process) {
            this.process.kill();
            this.process = null;
            this.isRunning = false;
        }
    }

    // 清理所有旧的Ollama进程
    private async killAllOllamaProcesses(): Promise<void> {
        try {
            logger.info('正在清理旧的Ollama进程...');

            // Windows系统使用taskkill命令
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            // 步骤3：强制结束所有ollama.exe进程
            try {
                await execAsync('taskkill /f /im ollama.exe');
                logger.info('已清理旧的Ollama进程');
            } catch (killError) {
                // 如果没有找到进程，taskkill会报错，这是正常的
                logger.info('没有发现需要清理的Ollama进程');
            }

            // 步骤4：等待一下确保进程完全结束
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            const msg = error instanceof Error ? error.message : '清理进程失败';
            logger.warn(`清理旧进程时出错: ${msg}`);
            // 不抛出错误，继续启动新进程
        }
    }
}

export const ollamaService = new OllamaService();