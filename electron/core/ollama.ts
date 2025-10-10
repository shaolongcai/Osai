// 步骤1：创建Ollama管理器
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { logger } from './logger.js';
import { fileURLToPath } from 'url';
import pathConfig from './pathConfigs.js';
import ollama from 'ollama'
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OllamaService {
    private process: ChildProcess | null = null;
    private isRunning = false;
    private ollamaPath: string;

    constructor() {
        // Ollama可执行文件路径
        this.ollamaPath = pathConfig.get('ollamaPath');
    }

    // 启动Ollama服务
    async start(): Promise<void> {
        if (this.isRunning) return;

        //启动前，清理所有进程
        await this.killAllOllamaProcesses();

        try {
            this.process = spawn(this.ollamaPath, ['serve'], {
                stdio: 'pipe',
                env: {
                    ...process.env,
                    OLLAMA_HOST: '127.0.0.1:11434',
                    OLLAMA_REGISTRY: 'https://docker.mirrors.ustc.edu.cn',   //国内专用中科大镜像
                }
            });

            this.process.on('error', (error) => {
                const msg = error instanceof Error ? error.message : 'Ollama启动失败';
                logger.error(`Ollama启动失败: ${msg}`);
                throw new Error(msg);
            });

            await this.waitForReady();
            this.isRunning = true;
            logger.info('Ollama服务启动成功');

        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Ollama启动失败';
            logger.error(`Ollama启动失败: ${msg}`);
            throw new Error(msg);
        }
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

    // 处理图像 - 替换Python方案
    async processImage(imagePath: string, prompt: string = '请使用中文摘要这张图片'): Promise<string> {
        try {
            // 读取图片并转换为base64
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');

            const response = await ollama.chat({
                model: 'qwen2.5vl:3b',
                messages: [{ role: 'user', content: prompt, images: [base64Image] }],
            })

            return response.message.content;

        } catch (error) {
            const msg = error instanceof Error ? error.message : '图像处理失败';
            logger.error(`图像处理失败: ${msg}`);
            throw new Error(msg);
        }
    }

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