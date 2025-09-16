import { spawn, ChildProcess } from 'child_process'
import pathConfig from '../core/pathConfigs.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import { setOpenIndexImages } from '../core/appState.js';
import { logger } from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Python常驻进程相关
let pythonProcess: ChildProcess | null = null;
let isProcessReady = false;
let taskCounter = 0;
const pendingTasks = new Map<string, { resolve: Function, reject: Function }>();
// Python 路径
const modeldir = pathConfig.get('models')
const modelName = 'Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf'
const mmprojName = 'mmproj-model-f16.gguf'
const visionModelPath = path.join(modeldir, modelName);
const mmprojPath = path.join(modeldir, mmprojName);

const PYTHON_ENV_PATH = path.join(__dirname, '../resources/venv/Scripts/python.exe')
const PYTHON_SCRIPT_PATH = path.join(__dirname, '../resources/pythonScript/vision_processor.py')


/**
 * 启动python进程,准备处理图片
 */
async function startPythonService(): Promise<void> {

    return new Promise((resolve, reject) => {

        if (pythonProcess && !pythonProcess.killed) {
            resolve();
            return;
        }
        logger.info('启动Python视觉处理服务...');

        // 启动Python进程
        pythonProcess = spawn(PYTHON_ENV_PATH, [PYTHON_SCRIPT_PATH], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });

        // 计算超时
        let initTimeout: NodeJS.Timeout;

        // 收集输出
        pythonProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter((line: string) => line.trim());
            lines.forEach((line: string) => {
                try {
                    const message = JSON.parse(line);

                    switch (message.type) {
                        case 'log':
                            logger.info(`Python服务:${message.msg}`);
                            break;

                        case 'init_result':
                            if (message.success) {
                                isProcessReady = true;
                                clearTimeout(initTimeout);
                                logger.info('Python服务初始化成功');
                                resolve();
                            } else {
                                clearTimeout(initTimeout);
                                reject(new Error('Python服务初始化失败'));
                            }
                            break;

                        case 'task_accepted':
                            logger.info(`任务 ${message.task_id} 已被接收`);
                            break;

                        case 'result':
                            // 处理任务结果
                            const taskId = message.task_id;
                            const task = pendingTasks.get(taskId);
                            if (task) {
                                if (message.success) {
                                    logger.info(`任务 ${taskId} 完成，耗时: ${message.elapsed_time?.toFixed(2)}秒`);
                                    task.resolve(message.result);
                                } else {
                                    task.reject(new Error(message.errMsg));
                                }
                                pendingTasks.delete(taskId);
                            }
                            break;

                        case 'error':
                            logger.error(`Python服务错误:${message.errMsg}`);
                            break;
                    }
                } catch (e) {
                    // console.log('Python输出:', line);
                }
            });
        })

        // 收集错误
        pythonProcess.stderr.on('data', (data) => {
            // console.error('日志输出:', data.toString());
        })

        // 处理进程结束
        pythonProcess.on('close', (code) => {
            logger.info(`Python服务退出，代码: ${code}`);
            isProcessReady = false;
            pythonProcess = null;

            // 拒绝所有待处理的任务
            pendingTasks.forEach((task) => {
                task.reject(new Error('Python服务意外退出'));
            });
            pendingTasks.clear();
        });

        // 检查文件是否存在
        if (!fs.existsSync(visionModelPath) || !fs.existsSync(mmprojPath)) {
            reject(new Error(`模型文件不存在`));
            return;
        }

        const initCommand = {
            type: 'init',
            model_path: visionModelPath,
            mmproj_path: mmprojPath
        };

        pythonProcess.stdin?.write(JSON.stringify(initCommand) + '\n');

        // 设置超时
        initTimeout = setTimeout(() => {
            pythonProcess.kill()
            reject(new Error('Python进程超时'))
        }, 30000) // 30秒超时
    })
}


/**
 * 使用Python常驻进程处理图片
 */
export async function summarizeImageWithPython(imagePath: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            // 确保服务已启动
            if (!isProcessReady) {
                await startPythonService();
            }

            // 检查图片文件是否存在
            if (!fs.existsSync(imagePath)) {
                reject(new Error(`node端：图片文件不存在: ${imagePath}`));
                return;
            }

            // 生成任务ID
            const taskId = `task_${++taskCounter}_${Date.now()}`;

            // 注册任务回调
            pendingTasks.set(taskId, { resolve, reject });

            // 发送处理命令
            const processCommand = {
                type: 'process',
                image_path: imagePath,
                task_id: taskId
            };

            pythonProcess?.stdin?.write(JSON.stringify(processCommand) + '\n');

            // 设置任务超时
            setTimeout(() => {
                if (pendingTasks.has(taskId)) {
                    pendingTasks.delete(taskId);
                    reject(new Error('图片处理超时'));
                }
            }, 60000); // 60秒超时

        } catch (error) {
            const msg = error instanceof Error ? error.message : '处理失败';
            reject(new Error(msg));
        }
    });
}


/**
 * 关闭Python服务
 */
export const shutdownVisionService = (): void => {
    if (pythonProcess && !pythonProcess.killed) {
        logger.info('关闭python图片服务')

        const shutdownCommand = { type: 'shutdown' };
        pythonProcess.stdin?.write(JSON.stringify(shutdownCommand) + '\n');

        setTimeout(() => {
            if (pythonProcess && !pythonProcess.killed) {
                pythonProcess.kill();
            }
        }, 5000);
    }
};


