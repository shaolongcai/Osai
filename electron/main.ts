import { execSync } from 'child_process';
execSync('chcp 65001', { stdio: 'inherit' });
import { app, BrowserWindow, globalShortcut, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, initializeDatabase, setConfig } from './database/sqlite.js';
import { initializeFileApi } from './api/file.js';
import { indexAllFilesWithWorkers, indexImagesService } from './core/indexFiles.js';
import { logger } from './core/logger.js';
import { checkGPU, reportErrorToWechat } from './core/system.js';
import { checkModelService } from './core/model.js'
import { ollamaService } from './core/ollama.js';
import { INotification } from './types/system.js';
import { initializeUpdateApi } from './api/update.js';
import { initializeSystemApi } from './api/system.js';


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
let win = null;

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

// 创建快捷键的UI
function createSearchBar() {
  win = new BrowserWindow({
    width: 480,
    height: 600,
    x: 0,               // 后面会计算居中
    y: 0,
    frame: false,       // 无边框
    resizable: false,
    movable: true,
    alwaysOnTop: true,  // 总在最前
    skipTaskbar: true,  // 不占用任务栏
    show: false,        // 先不显示
    transparent: true,
    backgroundColor: '#00000000',
    // hasShadow: false, // 如果想去掉系统阴影
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  // 加载搜索条HTML
  if (isDev) {
    win.loadURL('http://localhost:5173/search-bar.html');
    // win.webContents.openDevTools(); //打开开发者工具
  } else {
    win.loadFile(path.join(__dirname, '../frontend/dist/search-bar.html'));
  }
}


/**
 * 初始化所有必须条件
 * 1、初始化数据库
 * 2、启动ollama服务，初始化模型
 * 3、检查硬件
 * 4、检查是否已经准备好AI mark
 */
export const init = async () => {
  try {
    // 初始化数据库
    initializeDatabase()
    // 启动Ollama服务
    await ollamaService.start();
    // 检查硬件是否支持
    const gpuInfo = await checkGPU();
    // 检查模型是否存在（AI功能是否准备好）
    const modelExists = await checkModelService();
    console.log('模型是否存在', modelExists);
    setConfig('aiModel_installed', modelExists);
    // 检查CUDA安装包是否未解压
    // const cudaInfo = await checkCUDA();
    // const isInstallCuda = getConfig('cuda_installed');

    // 检查是否准备好AI Mark功能
    return {
      code: 0,
      data: {
        ...gpuInfo,
        isReadyAI: modelExists,
      },
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
  createSearchBar();
  // 初始化API
  initializeFileApi(mainWindow);
  initializeUpdateApi()
  initializeSystemApi()
  // 注册全局快捷键
  const shortcut = 'Alt+Space'; // 可改
  registerGlobalShortcut(shortcut);
  // 注册Esc关闭
  globalShortcut.register('Escape', () => {
    if (win.isVisible()) {
      win.hide();
    }
  });

  // 防止多开
  app.on('second-instance', () => {
    if (win) {
      if (!win.isVisible()) win.show();
      win.focus();
    }
  });
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
  //注销快捷键
  globalShortcut.unregisterAll()
  // 清理后端进程
});



//----- 触发事件 ---- 
export const sendToRenderer = (channel: string, data: any) => {
  mainWindow.webContents.send(channel, data);
};


// 注册全局快捷键
const registerGlobalShortcut = (shortcut: string) => {
  globalShortcut.register(shortcut, () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      centerOnCurrentDisplay();
      win.show();
      win.focus(); // 让输入框直接获得焦点
    }
  });
}

// 计算屏幕居中
const centerOnCurrentDisplay = () => {
  const cursor = screen.getCursorScreenPoint();
  const dist = screen.getDisplayNearestPoint(cursor).workArea;
  const { width, height } = win.getBounds();
  win.setBounds({
    x: Math.round(dist.x + (dist.width - width) / 2),
    y: Math.round(dist.y + dist.height * 0.25)   // 屏幕 1/4 处
  });
}