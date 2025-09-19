import * as path from 'path';
import fs from 'fs';
import { spawn } from 'child_process'
import pathConfig from '../core/pathConfigs.js';
import { fileURLToPath } from 'url';
import { INotification } from '../types/system.js';
import { setModelReady } from '../core/appState.js';
import { logger } from '../core/logger.js';
import { sendToRenderer } from '../main.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourcePath = pathConfig.get('resources')
// Python 路径
const PYTHON_ENV_PATH = path.join(resourcePath, 'venv/Scripts/python.exe')
const PYTHON_SCRIPT_PATH = path.join(resourcePath, 'pythonScript/downloadModel.py')
// 模型路径
const MODEL_PATH = pathConfig.get('models')

function executeDownloadModelPythonScript(): Promise<string> {

    return new Promise((resolve, reject) => {

        // 步骤1：检查Python路径是否存在
        if (!fs.existsSync(PYTHON_ENV_PATH)) {
            const msg = `虚拟环境Python不存在: ${PYTHON_ENV_PATH}`;
            logger.error(msg);
            reject(new Error(msg));
            return;
        }

        // 启动python
        const venvPath = path.dirname(path.dirname(PYTHON_ENV_PATH)); // 获取venv根目录
        const env = {
            ...process.env,
            PYTHONPATH: '', // 清空PYTHONPATH避免冲突
            PYTHONHOME: '', // 清空PYTHONHOME避免冲突
            VIRTUAL_ENV: venvPath,
            PATH: `${path.dirname(PYTHON_ENV_PATH)};${process.env.PATH}` // 优先使用venv的Scripts目录
        };

        // 步骤2：使用 spawn 创建并执行一个新的、独立的Python进程
        const pythonProcess = spawn(PYTHON_ENV_PATH, [PYTHON_SCRIPT_PATH, MODEL_PATH], {
            env: env
        });

        let stdout = '';
        let stderr = '';

        // 步骤3：收集脚本的标准输出
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        // 日志从这里输出
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // 处理进程退出事件
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                // 如果脚本以非0状态码退出，视为执行失败
                const msg = `Python script [${PYTHON_ENV_PATH}] exited with code ${code}: ${stderr}`;
                logger.error(msg);
                // 发送错误的信息给前端
                const notification: INotification = {
                    id: 'downloadModel',
                    text: '模型下载失败',
                    type: 'question',
                    tooltip: stderr,
                }
                sendToRenderer('system-info', notification);
                reject(new Error(msg));
            } else {
                // 成功执行，返回收集到的标准输出
                resolve(stdout);
            }
        });

        // 步骤6：处理进程启动时发生的错误
        process.on('error', (err) => {
            reject(err);
        });
    });
}

async function detectPythonEnvironment(): Promise<void> {
    return new Promise((resolve, reject) => {
        // 步骤1：检查Python路径是否存在
        if (!fs.existsSync(PYTHON_ENV_PATH)) {
            const msg = `虚拟环境Python不存在: ${PYTHON_ENV_PATH}`;
            logger.error(msg);
            reject(new Error(msg));
            return;
        }

         // 步骤2：设置虚拟环境变量（与executeDownloadModelPythonScript保持一致）
        const venvPath = path.dirname(path.dirname(PYTHON_ENV_PATH)); // 获取venv根目录
        const env = {
            ...process.env,
            PYTHONPATH: '', // 清空PYTHONPATH避免冲突
            PYTHONHOME: '', // 清空PYTHONHOME避免冲突
            VIRTUAL_ENV: venvPath,
            PATH: `${path.dirname(PYTHON_ENV_PATH)};${process.env.PATH}` // 优先使用venv的Scripts目录
        };

        // 步骤2：创建环境检测命令
        const commands = [
            'import sys; print(f"executable: {sys.executable}")',
            'import sys; print(f"virtual_env: {hasattr(sys, \'real_prefix\') or (hasattr(sys, \'base_prefix\') and sys.base_prefix != sys.prefix)}")',
            'import os; print(f"VIRTUAL_ENV: {os.environ.get(\'VIRTUAL_ENV\', \'Not Set\')}")'
        ];

        const detectCmd = commands.join('; ');
        const pythonProcess = spawn(PYTHON_ENV_PATH, ['-c', detectCmd],{ env } );

        let output = '';
        let errorOutput = '';

        // 步骤3：捕获标准输出
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        // 步骤4：捕获错误输出
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // 步骤5：处理进程结束
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                logger.info(`Python环境信息:\n${output}`);
                resolve();
            } else {
                const errorMsg = `python环境检测失败: ${code}${errorOutput ? `\n错误信息: ${errorOutput}` : ''}`;
                logger.error(errorMsg);
                reject(new Error(errorMsg));
            }
        });

        // 步骤6：处理进程启动错误
        pythonProcess.on('error', (err) => {
            const msg = `Python进程启动失败: ${err.message}`;
            logger.error(msg);
            reject(new Error(msg));
        });
    });
}


/**
 * 检查模型
 */
async function checkModel() {
    try {
        const modelsDir = pathConfig.get('models')
        const modelPath = path.join(modelsDir, 'Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf')
        const mmprojPath = path.join(modelsDir, 'mmproj-model-f16.gguf')

        //检查是否有这个模型,model 与投影model都需要存在
        if (!fs.existsSync(modelPath) || !fs.existsSync(mmprojPath)) {
            // logger.info('models--BAAI--bge-base-zh-v1.5 不存在');
            return false
        }
        //若模型存在，立即告知appState.ts ，开始视觉索引
        setModelReady(true);
        return true
    } catch (error) {
        logger.error(`检查模型失败:${error.message}`);
        return false
    }
}


export async function downloadModel(sendToRenderer: (channel: string, data: any) => void) {
    try {

        // 步骤1：先检测Python环境
        await detectPythonEnvironment();

        // 检查是否有模型
        const isExist = await checkModel()
        if (isExist) {
            logger.info('模型已存在，无需下载')
            const notification: INotification = {
                id: 'downloadModel',
                text: 'AI服务已就绪',
                type: 'success',
            }
            sendToRenderer('system-info', notification)
            return
        }
        // 准备从远端拉取模型
        const notification: INotification = {
            id: 'downloadModel',
            text: '正在下载AI模型',
            type: 'loading',
            tooltip: '这通常需要3~5分钟，视乎你的网络'
        }
        sendToRenderer('system-info', notification)
        const result = await executeDownloadModelPythonScript();
        logger.info(`脚本输出:${result}`);
        const successNotification: INotification = {
            id: 'downloadModel',
            text: 'AI服务已就绪',
            type: 'success',
        }
        sendToRenderer('system-info', successNotification)
        setModelReady(true);
    } catch (error) {
        const msg = error instanceof Error ? error.message : '执行脚本失败';
        logger.error(msg);
        // 在您的应用中，这里可以调用 message.error(msg) 向用户显示错误
    }
}