import path from "path";
import pathConfig from "./pathConfigs.js";
import { getLlama, LlamaModel, LlamaEmbeddingContext } from 'node-llama-cpp';

// 全局变量存储模型实例
let llamaModel: LlamaModel | null = null;
let llamaContext: LlamaEmbeddingContext | null = null;
/**
 * 初始化嵌入模型
 */
export const initEmbeddingModel = async (): Promise<void> => {
    try {
        // 1. 获取模型文件路径
        const resourcePath = pathConfig.get('resources');
        const modelPath = path.join(resourcePath, 'bge-small-zh-v1.5-f16.gguf');

        console.log('正在加载嵌入模型...');
        console.log(`模型路径: ${modelPath}`);

        // 2. 获取 llama 实例
        const llama = await getLlama();

        // 3. 加载模型（使用正确的 API）
        llamaModel = await llama.loadModel({
            modelPath: modelPath
        });

        // 4. 创建上下文
        llamaContext = await llamaModel.createEmbeddingContext();

        console.log('嵌入模型加载完成');
    } catch (error) {
        const msg = error instanceof Error ? error.message : '模型加载失败';
        console.error(`嵌入模型初始化失败: ${msg}`);
        throw error;
    }
};

/**
 * 文本向量化
 */
export const vectorizeText = async (text: string): Promise<number[]> => {
    try {
        // 1. 检查模型是否已初始化
        if (!llamaContext || !llamaModel) {
            await initEmbeddingModel();
        }

        // 2. 生成文本嵌入
        const embedding = await llamaContext!.getEmbeddingFor(text);

        // 3. 转换为数组格式
        return Array.from(embedding.vector);
    } catch (error) {
        const msg = error instanceof Error ? error.message : '向量化失败';
        console.error(`文本向量化失败: ${msg}`);
    }
};


/**
 * 清理模型资源
 */
export const cleanupModel = async (): Promise<void> => {
    try {
        if (llamaContext) {
            await llamaContext.dispose();
            llamaContext = null;
        }
        if (llamaModel) {
            await llamaModel.dispose();
            llamaModel = null;
        }
        console.log('模型资源已清理');
    } catch (error) {
        const msg = error instanceof Error ? error.message : '资源清理失败';
        console.error(`清理模型资源失败: ${msg}`);
    }
};