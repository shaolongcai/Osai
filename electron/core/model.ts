import { getLlama, LlamaModel, LlamaChatSession } from 'node-llama-cpp';
import * as fs from 'fs';
import pathConfig from './pathConfigs.js';
import * as path from 'path';


// 全局变量存储视觉模型实例
let visionModel: LlamaModel | null = null;
let visionSession: LlamaChatSession | null = null;

/**
 * 初始化视觉模型
 */
export const initVisionModel = async (): Promise<void> => {
    try {
        if (visionModel && visionSession) {
            return; // 已初始化
        }

        console.log('正在加载视觉模型...');

        // 1. 获取 llama 实例
        const llama = await getLlama();

        // 2. 加载支持视觉的模型（需要下载支持多模态的模型）
        const visionModeldir = pathConfig.get('models')
        const modelName = 'Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf'
        const visionModelPath = path.join(visionModeldir, modelName);

        visionModel = await llama.loadModel({
            modelPath: visionModelPath,
            // 启用视觉功能
            mmprojPath: path.join(visionModeldir, 'mmproj-model-f16.gguf')
        });

        // 3. 创建聊天会话
        const context = await visionModel.createContext();
        visionSession = new LlamaChatSession({
            contextSequence: context.getSequence()
        });

        console.log('视觉模型加载完成');
    } catch (error) {
        const msg = error instanceof Error ? error.message : '视觉模型加载失败';
        console.error(`视觉模型初始化失败: ${msg}`);
        throw error;
    }
};


/**
 * 大模型摘要
 */
export async function summarizeImage(filePath: string): Promise<string> {
    try {
        // 1. 初始化视觉模型
        await initVisionModel();
        
        // 2. 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error(`图片文件不存在: ${filePath}`);
        }
        
        // 3. 直接使用 visionSession 处理图片
        const prompt = "请描述这张图片的内容，用中文回答。";
        
        const response = await visionSession!.createCompletion(prompt, {
            image: filePath
        });
        
        console.log(`图片摘要完成: ${filePath}`);
        return response.trim();
        
    } catch (error) {
        const msg = error instanceof Error ? error.message : '图片摘要失败';
        console.error(`图片摘要失败 ${filePath}: ${msg}`);
        return `摘要失败: ${msg}`;
    }
}