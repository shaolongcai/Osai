// require('ts-node/register'); //开发环境使用
// const logger = require('./logger.ts').default;
import pathConfig from './core/pathConfigs.js';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { getFilesCount, initializeDatabase } from './database/sqlite.js';
import { initializeFileApi } from './api/file.js';
import { initLanceDB } from './database/lanceDb.js';
// import logger from './logger.js';

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


/**
 * 检查模型
 */
async function checkModel() {
  try {
    // logger.info('=== 开始检查嵌入模型是否存在 ===');
    // 获取现在模型的路径(暂时)
    // 获取 HuggingFace 缓存目录路径
    const userHome = os.homedir();
    const hfCacheDir = path.join(userHome, '.cache', 'huggingface', 'hub');
    const modelPath = path.join(hfCacheDir, 'models--BAAI--bge-base-zh-v1.5');

    //检查是否有这个模型
    if (!fs.existsSync(modelPath)) {
      // logger.info('models--BAAI--bge-base-zh-v1.5 不存在');
      return { success: false, error: '模型不存在' };
    }
    return { success: true };
  } catch (error) {
    // logger.error(`检查模型失败:${error.message}`);
    return { success: false, error: '检查模型失败' };
  }
}


/**
 * 打开某个目录
 * @param {} filePath 
 * @returns 
 */
const openDir = (type: string) => {
  const appPath = ''
  // const appPath = pathConfig.default.get('appData')
  switch (type) {
    // 打开运行日志
    case 'runLog':
      shell.openPath(path.join(appPath, 'backend_logs'));
      break;
    // 打开安装日志
    case 'installLog':
      // shell.openPath(pathConfig.default.get('logs'));
      break;
    case 'localData':
      shell.openPath(path.join(appPath, 'data'));
      break;
    case 'upload':
      shell.openPath(path.join(appPath, 'uploads'));
      break;
    default:
      break;
  }
}

// 打开upload目录
const openUploadDir = (filePath: string) => {
  // 确定目录路径
  const uploadDir = app.isPackaged ? path.join(process.resourcesPath, 'uploads', filePath) : path.join(__dirname, '..', 'backend', 'uploads', filePath);
  // logger.info(`打开目录:${uploadDir}`);
  if (!fs.existsSync(uploadDir)) {
    // logger.error(`目录不存在:${uploadDir}`);
    return;
  }
  shell.openPath(uploadDir);
}


// 检查系统配置是否达标
// async function checkSystemStatusHandler() {
//   try {
//     const result = await checkSystemStatus(logger);
//     return result;
//   } catch (error) {
//     logger.error(`系统配置检查失败: ${error.message}`);
//     return { success: false, error: error.message };
//   }
// }


//----- 触发事件 ---- 

// 打开文件所在位置，filePath为相对位置（即MD5）
ipcMain.handle('open-file-location', (event, filePath) => { openUploadDir(filePath) });
// 打开某个路径（📌，需要取代open-file-location）
ipcMain.handle('open-dir', (event, type) => { openDir(type) });


// 应用事件
app.whenReady().then(() => {
  createWindow();
  // 初始化数据库
  initializeDatabase()
  // 初始化API
  initializeFileApi(mainWindow);
  // 初始化数据库
  initializeDatabase();
  // 初始化向量数据库
  // initLanceDB();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // 清理后端进程

});