import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { logger } from './logger.js';
import pathConfig from './pathConfigs.js';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OllamaService {
    private process: ChildProcess | null = null;
    private isRunning = false;
    private ollamaPath: string;
    private aiWorker: Worker | null = null;
    private pendingAiRequests: Map<string, { resolve: Function; reject: Function }>


    constructor() {
        this.ollamaPath = pathConfig.get('ollamaPath');
        this.pendingAiRequests = new Map()
        this.initializeAiWorker()
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

    //AI线程初始化
    private initializeAiWorker() {
        try {
            this.aiWorker = new Worker(path.join(__dirname, '../workers/ai.worker.js'));

            // 监听Worker消息
            this.aiWorker.on('message', (response: any) => {
                const { requestId, success, result, error } = response;
                const pending = this.pendingAiRequests.get(requestId);

                if (pending) {
                    this.pendingAiRequests.delete(requestId);
                    if (success) {
                        pending.resolve(result);
                    } else {
                        pending.reject(new Error(error)); //这里reject到file.ts 然后报错，后期在这里加上重试
                    }
                }
            });

            // 监听Worker错误
            this.aiWorker.on('error', (error) => {
                console.error(`AI处理Worker错误: ${error.message}`);
                // restartImageWorker();
            });

            // 监听Worker退出
            this.aiWorker.on('exit', (code) => {
                if (code !== 0) {
                    console.warn(`AI处理Worker异常退出，代码: ${code}`);
                    // restartImageWorker();
                }
            });
        } catch (error) {
            console.error(`初始化AI处理Worker失败: ${error}`);
        }
    }


    // 使用线程生成文本
    async generate(params: GenerateRequest): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.aiWorker) {
                reject(new Error('文档处理Worker未初始化'));
                return;
            }

            const requestId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 存储Promise的resolve和reject
            this.pendingAiRequests.set(requestId, { resolve, reject });

            // 发送任务到Worker
            this.aiWorker.postMessage({
                path: params.path,
                prompt: params.prompt,
                content: params.content.slice(0, 4000), //只存入前4000字
                isImage: params.isImage,
                isJson: params.isJson,
                jsonFormat: params.jsonFormat,
                requestId
            });
        });
    }

    // 重启 Worker
    // private restartImageWorker(): void {
    //     try {
    //         // 清理所有待处理的请求
    //         for (const [requestId, pending] of this.pendingRequests) {
    //             pending.reject(new Error('Worker重启，请求被取消'));
    //         }
    //         this.pendingRequests.clear();

    //         // 关闭旧的Worker
    //         if (this.imageWorker) {
    //             this.imageWorker.terminate();
    //             this.imageWorker = null;
    //         }

    //         // 重新初始化Worker
    //         setTimeout(() => {
    //             this.initializeImageWorker();
    //         }, 1000); // 延迟1秒重启

    //     } catch (error) {
    //         // logger.error(`重启图像处理 Worker 失败: ${error}`);
    //     }
    // }


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