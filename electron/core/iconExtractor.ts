import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NativeIconModule {
  extractIcon(filePath: string, size?: number): Buffer | null;
  batchExtractIcons(filePaths: string[], size?: number): (Buffer | null)[];
}

let nativeModule: NativeIconModule | null = null;

/**
 * 动态加载原生模块
 * @returns 加载成功的原生模块实例，失败返回null
 */
async function loadNativeModule(): Promise<NativeIconModule | null> {
  try {
    console.log('尝试加载原生模块...');
    const {createRequire} = await import('module');
    const require = createRequire(import.meta.url);
    
    // 优先尝试使用 electron-rebuild 生成的模块
    const electronModulePath = path.join(__dirname, 'bin', 'win32-x64-139', 'core.node');
    const fallbackModulePath = path.join(__dirname, '../resources/build/Release/toIcon.node');
    
    let modulePath = electronModulePath;
    
    // 检查 electron-rebuild 生成的模块是否存在
    if (!fs.existsSync(electronModulePath)) {
      console.log('Electron 模块不存在，使用备用路径');
      modulePath = fallbackModulePath;
    }
    
    console.log('模块路径:', modulePath);
    console.log('模块文件是否存在:', fs.existsSync(modulePath));
    
    if (fs.existsSync(modulePath)) {
      console.log('开始加载原生模块...');
      
      nativeModule = require(modulePath);
      console.log('原生模块加载成功:', !!nativeModule);
      console.log('可用方法:', Object.keys(nativeModule || {}));
      return nativeModule;
    } else {
      console.warn('原生模块文件不存在:', modulePath);
    }
  } catch (error) {
    console.error('加载原生图标提取模块失败:', error);
  }
  return null;
}

/**
 * 提取单个文件的图标
 * @param filePath 文件路径
 * @param size 图标尺寸，默认256
 * @returns PNG图标数据的Buffer，失败返回null
 */
export async function extractIcon(filePath: string, size: number = 256): Promise<Buffer | null> {
  try {
    console.log('extractIcon 被调用，文件路径:', filePath);
    
    if (!nativeModule) {
      console.log('原生模块未加载，尝试加载...');
      nativeModule = await loadNativeModule();
    }
    
    if (nativeModule) {
      console.log('调用原生模块的 extractIcon 方法...');
      // 将同步调用包装为异步，避免阻塞主线程
      const result = await new Promise<Buffer | null>((resolve) => {
        try {
          const buffer = nativeModule!.extractIcon(filePath, size);
          resolve(buffer);
        } catch (error) {
          console.error('原生模块调用失败:', error);
          resolve(null);
        }
      });
      
      console.log('原生模块返回结果:', result ? `Buffer(${result.length} bytes)` : 'null');
      return result;
    } else {
      console.warn('原生模块不可用');
    }
  } catch (error) {
    console.error('提取图标失败:', error);
  }
  return null;
}

/**
 * 批量提取文件图标
 * @param filePaths 文件路径数组
 * @param size 图标尺寸，默认256
 * @returns PNG图标数据的Buffer数组，失败的项为null
 */
export async function batchExtractIcons(filePaths: string[], size: number = 256): Promise<(Buffer | null)[]> {
  try {
    if (!nativeModule) {
      nativeModule = await loadNativeModule();
    }
    
    if (nativeModule) {
      // 将同步调用包装为异步
      const result = await new Promise<(Buffer | null)[]>((resolve) => {
        try {
          const buffers = nativeModule!.batchExtractIcons(filePaths, size);
          resolve(buffers);
        } catch (error) {
          console.error('批量提取图标失败:', error);
          resolve(filePaths.map(() => null));
        }
      });
      return result;
    }
  } catch (error) {
    console.error('批量提取图标失败:', error);
  }
  return filePaths.map(() => null);
}

/**
 * 检查原生模块是否可用
 */
export async function isNativeModuleAvailable(): Promise<boolean> {
  if (!nativeModule) {
    nativeModule = await loadNativeModule();
  }
  return nativeModule !== null;
}

/**
 * 将Buffer保存为PNG文件
 * @param buffer PNG数据Buffer
 * @param outputPath 输出文件路径
 */
export function savePngBuffer(buffer: Buffer, outputPath: string): void {
  fs.writeFileSync(outputPath, buffer);
}