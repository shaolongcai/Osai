import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, initializeDatabase } from './database/sqlite.js';
import { initializeFileApi } from './api/file.js';
import { indexAllFilesWithWorkers, indexImagesService } from './core/indexFiles.js';
import { shutdownVisionService } from './pythonScript/imageService.js';
import { logger } from './core/logger.js';
import { checkGPU } from './core/system.js';
import { downloadModel } from './pythonScript/downloadModle.js';
import { initializeModel, ModelDownloader } from './core/model.js'

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


// 初始化所有必须条件
export const init = async () => {
  // 初始化数据库
  initializeDatabase()
  //检查GPU
  await checkGPU()
  // 初始化模型
  initializeModel(); //看情况并入 ModelDownloader
  // 初始化向量数据库
  // initLanceDB();
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
  // 开启视觉索引 （由appState控制继续还是关闭）
  indexImagesService();
}


// 应用事件
app.whenReady().then(() => {
  createWindow();
  // 初始化API
  initializeFileApi(mainWindow);
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
  shutdownVisionService();
});