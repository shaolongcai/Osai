import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import pathConfig from './pathConfigs.js';

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
  if (nativeModule) {
    return nativeModule;
  }

  try {
    console.log('正在加载原生图标提取模块...');
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);

    // 新的模块路径 (推荐使用)
    const modulePath = pathConfig.get('iconExtractor')

    try {
      if (fs.existsSync(modulePath)) {
        nativeModule = require(modulePath);
        console.log('成功加载原生模块:', modulePath);
        console.log('可用方法:', Object.keys(nativeModule || {}));
        return nativeModule;
      }
    } catch (error) {
      console.log(`模块路径 ${modulePath} 加载失败，尝试下一个...`);
    }

    throw new Error('所有模块路径都加载失败');
  } catch (error) {
    const msg = error instanceof Error ? error.message : '模块加载失败';
    console.error('原生图标提取模块加载失败:', msg);
    console.error('请确保已正确编译原生模块：');
    console.error('1. cd electron/native');
    console.error('2. npm install');
    console.error('3. npm run build:electron');
  }
  return null;
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
 * 解析windows应用的icon（文件ICON是另外的）
 * 总提取函数
 * @param displayIcon
 * @param installLoc
 * @returns 返回图片png形式
 */
export async function extractIconOnWindows(displayIcon: string | null, installLoc: string): Promise<string> {
  const cacheDir = pathConfig.get('iconsCache')
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  let srcPath = ''
  if (displayIcon) {
    srcPath = displayIcon.split(',')[0].trim().replace(/^"|"$/g, '')
  }

  if (!srcPath || !fs.existsSync(srcPath)) {
    if (installLoc && fs.existsSync(installLoc)) {
      try {
        const executables = fs
          .readdirSync(installLoc, { withFileTypes: true })
          .filter(
            (d) =>
              d.isFile() &&
              (d.name.toLowerCase().endsWith('.exe') || d.name.toLowerCase().endsWith('.dll'))
          )
          .map((d) => path.join(installLoc, d.name))

        const dirName = path.basename(installLoc).toLowerCase()
        const mainExe = executables.find((exe) => {
          const exeName = path.basename(exe, path.extname(exe)).toLowerCase()
          return exeName === dirName || dirName.includes(exeName)
        })

        srcPath = mainExe || executables[0] || ''
      } catch (e) {
        console.error(`读取安装目录失败: ${installLoc}`, e)
        srcPath = ''
      }
    }
  }

  if (!srcPath || !fs.existsSync(srcPath)) {
    console.warn(`最终无法确定图标源路径: displayIcon=${displayIcon}, installLoc=${installLoc}`)
    return ''
  }

  try {
    const stat = fs.statSync(srcPath)
    const key = `${path.parse(srcPath).name}_${stat.size}_${stat.mtimeMs}`.replace(
      /[^a-zA-Z0-9_]/g,
      ''
    )
    const pngPath = path.join(cacheDir, `${key}.png`)

    if (fs.existsSync(pngPath)) {
      return pngPath
    }

    const iconBuffer = await extractIcon(srcPath, 256)

    if (iconBuffer) {
      savePngBuffer(iconBuffer, pngPath)
      return pngPath
    } else {
      console.warn(`使用原生模块提取图标失败: ${srcPath}`)
      return ''
    }
  } catch (e) {
    console.error('提取图标过程中发生错误', srcPath, e)
    return ''
  }
}

/**
 * 提取单个文件的图标
 * @param filePath 文件路径
 * @param size 图标尺寸，默认256
 * @returns PNG图标数据的Buffer，失败返回null
 */
export async function extractIcon(filePath: string, size: number = 256): Promise<Buffer | null> {
  try {

    if (!nativeModule) {
      console.log('原生模块未加载，尝试加载...');
      nativeModule = await loadNativeModule();
    }

    if (nativeModule) {
      // console.log('调用原生模块的 extractIcon 方法...');
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
 * 将Buffer保存为PNG文件
 * @param buffer PNG数据Buffer
 * @param outputPath 输出文件路径
 */
export function savePngBuffer(buffer: Buffer, outputPath: string): void {
  fs.writeFileSync(outputPath, buffer);
}