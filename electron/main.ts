import { app, BrowserWindow } from 'electron';
import path from 'path';
import * as fs from 'fs'
import { fileURLToPath } from 'url';
import { getConfig, initializeDatabase } from './database/sqlite.js';
import { initializeFileApi } from './api/file.js';
import { indexAllFilesWithWorkers, indexImagesService } from './core/indexFiles.js';
import { logger } from './core/logger.js';
import { checkGPU, extractZip, reportErrorToWechat } from './core/system.js';
import { initializeModel } from './core/model.js'
import { ollamaService } from './core/ollama.js';
import pathConfig from './core/pathConfigs.js';
import { INotification } from './types/system.js';
import { initializeUpdateApi } from './api/update.js';

// ES 模块中的 __dirname 和 __filename 替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

/**
 * __dirname 的组成：
 * [安装盘符]\[安装路径]\resources\app.asar\electron
 * F 盘示例：
 * F:\MyApp\resources\app.asar\electron
 */
let mainWindow: BrowserWindow | null;

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // icon: path.join(__dirname, 'assets', 'icon.png'), // 可选：应用图标
    show: false, // 初始不显示，等待准备完成
    autoHideMenuBar: true,
    // frame: false,
  });

  // 开发环境加载开发服务器，生产环境加载打包后的文件
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); //打开开发者工具
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  // 窗口加载完成后
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}



//----- 触发事件 ---- 
export const sendToRenderer = (channel: string, data: any) => {
  mainWindow.webContents.send(channel, data);
};


//解压CUDA服务
export const extractCUDA = async () => {
  // 检查是否有cuda.zip文件
  const cudaDir = path.join(pathConfig.get('resources'), 'Ollama', 'lib', 'ollama');
  const v12ZipPath = path.join(cudaDir, 'cudaV12.zip');
  const v13ZipPath = path.join(cudaDir, 'cudaV13.zip');
  // 判断文件是否存在，而不是判断路径字符串是否存在
  if (fs.existsSync(v12ZipPath)) {
    logger.info(`发现CUDA V12压缩包: ${v12ZipPath}`);
    await extractZip(v12ZipPath, cudaDir);
  } else if (fs.existsSync(v13ZipPath)) {
    logger.info(`发现CUDA V13压缩包: ${v13ZipPath}`);
    await extractZip(v13ZipPath, cudaDir);
  }
  else {
    logger.info(`未发现CUDA V12或V13压缩包`);
  }
}

/**
 * 初始化所有必须条件
 * 1、初始化数据库
 * 2、启动ollama服务，初始化模型
 */
export const init = async () => {
  try {
    // 初始化数据库
    initializeDatabase()
    // 解压CUDA服务
    await extractCUDA();
    // 启动Ollama服务
    await ollamaService.start();
    return {
      code: 0,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '未知原因'
    logger.error(`初始化失败:${JSON.stringify(msg)}`)
    // 向企业微信报告
    const errorData = {
      类型: '初始化失败',
      错误位置: error.stack,
      错误信息: msg,
    };
    reportErrorToWechat(errorData)
    return {
      code: 1,
      errMsg: msg + '请重启应用或联系开发者'
    }
  }
}

/**
 * 开始索引任务
 */
export const startIndexTask = async () => {
  try {
    //检查GPU
    await checkGPU()
    // 判断是否需要索引
    const lastIndexTime = getConfig('last_index_time');
    const indexInterval = getConfig('index_interval'); //获取索引周期，默认1个小时，时间戳
    const currentTime = Date.now();
    // 是否超过1小时
    if (!lastIndexTime || (currentTime - lastIndexTime > indexInterval)) {
      logger.info(`索引间隔超过1小时，重新索引`);
      // 索引间隔超过1小时，重新索引
      indexAllFilesWithWorkers();
    }
    else {
      logger.info(`缓存期间无需索引`);
      // 无需重新索引，直接获取数据库的数据返回
      const last_index_file_count = getConfig('last_index_file_count');
      sendToRenderer('index-progress', {
        message: `已索引 ${last_index_file_count} 个文件`,
        process: 'finish',
        count: last_index_file_count
      })
    }
    //初始化模型（如果没有会自动拉取）
    await initializeModel();
    // 开启视觉索引 （由appState控制继续还是关闭）
    indexImagesService();
  } catch (error) {
    const msg = error instanceof Error ? error.message : '索引任务失败';
    logger.error(`索引任务开始失败: ${msg}`);
    const notification: INotification = {
      id: 'indexTask',
      text: '索引任务存在问题',
      type: 'warning',
      tooltip: msg
    }
    sendToRenderer('system-info', notification);
    // 报告企业微信
    const errorData = {
      类型: '索引任务失败',
      错误位置: error.stack,
      错误信息: msg,
    };
    reportErrorToWechat(errorData)
  }
}


// 应用事件
app.whenReady().then(() => {
  createWindow();
  // 初始化API
  initializeFileApi(mainWindow);
  // 初始化更新APO
  initializeUpdateApi()
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // 清理后端进程
});