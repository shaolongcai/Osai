import * as path from 'path';
import fs from 'fs';
import { spawn } from 'child_process'
import pathConfig from '../core/pathConfigs.js';
import { fileURLToPath } from 'url';
import { INotification } from '../types/system.js';
import { setModelReady } from '../core/appState.js';
import { logger } from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Python 路径
const PYTHON_ENV_PATH = path.join(__dirname, '../resources/venv/Scripts/python.exe')
const PYTHON_SCRIPT_PATH = path.join(__dirname, '../resources/pythonScript/downloadModel.py')
// 模型路径
const MODEL_PATH = pathConfig.get('models')

function executeDownloadModelPythonScript(): Promise<string> {

    return new Promise((resolve, reject) => {
        // 步骤2：使用 spawn 创建并执行一个新的、独立的Python进程
        const process = spawn(PYTHON_ENV_PATH, [PYTHON_SCRIPT_PATH, MODEL_PATH]);

        let stdout = '';
        let stderr = '';

        // 步骤3：收集脚本的标准输出
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        // 日志从这里输出
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // 处理进程退出事件
        process.on('close', (code) => {
            if (code !== 0) {
                // 如果脚本以非0状态码退出，视为执行失败
                const msg = `Python script [${PYTHON_ENV_PATH}] exited with code ${code}: ${stderr}`;
                logger.error(msg);
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
        // logger.error(`检查模型失败:${error.message}`);
        return false
    }
}


export async function downloadModel(sendToRenderer: (channel: string, data: any) => void) {
    try {
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
        sendToRenderer('', successNotification)
        setModelReady(true);
    } catch (error) {
        const msg = error instanceof Error ? error.message : '执行脚本失败';
        logger.error(msg);
        // 在您的应用中，这里可以调用 message.error(msg) 向用户显示错误
    }
}