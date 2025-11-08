import { execSync } from 'child_process';
execSync('chcp 65001', { stdio: 'inherit' });
import { app, BrowserWindow, globalShortcut, screen, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
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

// 定義退出標誌
let isQuitting = false;

/**
 * __dirname 的组成：
 * [安装盘符]\[安装路径]\resources\app.asar\electron
 * F 盘示例：
 * F:\MyApp\resources\app.asar\electron
 */
let mainWindow: BrowserWindow | null;
let win = null;
let tray: Tray | null = null;

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
    
    // 生產環境：屏蔽開發者工具快捷鍵
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // 屏蔽 Ctrl+Shift+I (Windows/Linux) 和 Cmd+Option+I (macOS)
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
      }
      // 屏蔽 F12
      if (input.key === 'F12') {
        event.preventDefault();
      }
      // 屏蔽 Ctrl+Shift+C (元素檢查器)
      if (input.control && input.shift && input.key.toLowerCase() === 'c') {
        event.preventDefault();
      }
    });
  }

  // 窗口加载完成后
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // 修改關閉行為：點擊關閉按鈕時最小化到托盤，而不是退出應用
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
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
    win.webContents.openDevTools(); //打开开发者工具
  } else {
    win.loadFile(path.join(__dirname, '../frontend/dist/search-bar.html'));
    
    // 生產環境：屏蔽開發者工具快捷鍵
    win.webContents.on('before-input-event', (event, input) => {
      // 屏蔽 Ctrl+Shift+I (Windows/Linux) 和 Cmd+Option+I (macOS)
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
      }
      // 屏蔽 F12
      if (input.key === 'F12') {
        event.preventDefault();
      }
      // 屏蔽 Ctrl+Shift+C (元素檢查器)
      if (input.control && input.shift && input.key.toLowerCase() === 'c') {
        event.preventDefault();
      }
    });
  }

  // 當搜索框失去焦點時自動隱藏（開發模式下禁用，避免與開發者工具衝突）
  if (!isDev) {
    win.on('blur', () => {
      if (win && win.isVisible()) {
        win.hide();
      }
    });
  }
}

// 更新托盤菜單語言
function updateTrayMenu(language?: string) {
  if (!tray) return;
  
  // 如果沒有提供語言，則獲取當前語言設置
  const currentLanguage = language || getAppLanguage();
  const t = loadTrayTranslations(currentLanguage);
  
  // 更新托盤提示文本
  tray.setToolTip(t.tooltip);
  
  // 重新創建托盤菜單
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t.showMainWindow,
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: t.showSearchBar,
      click: () => {
        if (win) {
          centerOnCurrentDisplay();
          win.show();
          win.focus();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: t.settings,
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate-to-settings');
        }
      }
    },
    {
      label: t.restart,
      click: () => {
        isQuitting = true;
        app.relaunch();
        app.exit(0);
      }
    },
    {
      type: 'separator'
    },
    {
      label: t.quit,
      accelerator: 'CommandOrControl+Q',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  logger.info(`托盤菜單已更新為語言: ${currentLanguage}`);
}

// 獲取用戶設置的語言
function getAppLanguage(): string {
  // 從數據庫獲取用戶設置的語言
  try {
    const savedLanguage = getConfig('app_language');
    if (savedLanguage) {
      return savedLanguage as string;
    }
  } catch (error) {
    logger.info('未找到保存的語言設置，使用默認語言');
  }

  // 如果沒有設置，默認使用en-US
  return 'en-US';
}

// 加載托盤翻譯文件
function loadTrayTranslations(language: string): any {
  try {
    const localesPath = isDev
      ? path.join(__dirname, '../frontend/public/locales', language, 'tray.json')
      : path.join(__dirname, '../frontend/dist/locales', language, 'tray.json');
    
    const translationData = readFileSync(localesPath, 'utf-8');
    return JSON.parse(translationData);
  } catch (error) {
    logger.error(`加載翻譯文件失敗 (${language}): ${error instanceof Error ? error.message : error}`);
    // 降級到中文簡體
    try {
      const fallbackPath = isDev
        ? path.join(__dirname, '../frontend/public/locales/zh-CN/tray.json')
        : path.join(__dirname, '../frontend/dist/locales/zh-CN/tray.json');
      const translationData = readFileSync(fallbackPath, 'utf-8');
      return JSON.parse(translationData);
    } catch (fallbackError) {
      logger.error(`加載降級翻譯文件也失敗: ${fallbackError instanceof Error ? fallbackError.message : fallbackError}`);
      // 返回硬編碼的默認值
      return {
        showMainWindow: 'Show Main Window',
        showSearchBar: 'Show Search Bar',
        settings: 'Settings',
        restart: 'Restart',
        quit: 'Quit',
        tooltip: 'Osai - AI Search Assistant'
      };
    }
  }
}

// 創建系統托盤
function createTray() {
  // 獲取當前語言
  const language = getAppLanguage();
  // 加載翻譯
  const t = loadTrayTranslations(language);
  
  // 獲取托盤圖標路徑
  const iconPath = isDev 
    ? path.join(__dirname, '../electron/resources/assets/icon.png')
    : path.join(__dirname, 'resources/assets/icon.png');
  
  // 創建托盤圖標
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  // 設置托盤提示文本
  tray.setToolTip(t.tooltip);
  
  // 創建托盤菜單
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t.showMainWindow,
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: t.showSearchBar,
      click: () => {
        if (win) {
          centerOnCurrentDisplay();
          win.show();
          win.focus();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: t.settings,
      click: () => {
        // 顯示主窗口並導航到設定頁面
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          // 發送事件到渲染進程，讓前端導航到設定頁面
          mainWindow.webContents.send('navigate-to-settings');
        }
      }
    },
    {
      label: t.restart,
      click: () => {
        // 重新啟動應用
        isQuitting = true;
        app.relaunch();
        app.exit(0);
      }
    },
    {
      type: 'separator'
    },
    {
      label: t.quit,
      accelerator: 'CommandOrControl+Q',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  // 設置托盤菜單
  tray.setContextMenu(contextMenu);
  
  // 雙擊托盤圖標顯示主窗口
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
  
  // 單擊托盤圖標顯示搜索框（Windows系統）
  if (process.platform === 'win32') {
    tray.on('click', () => {
      if (win) {
        if (win.isVisible()) {
          win.hide();
        } else {
          centerOnCurrentDisplay();
          win.show();
          win.focus();
        }
      }
    });
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
    if (!lastIndexTime || (currentTime - lastIndexTime > indexInterval) || true) {
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
  createTray(); // 創建系統托盤
  // 初始化API
  initializeFileApi(mainWindow);
  initializeUpdateApi()
  initializeSystemApi()
  
  // 監聽托盤菜單語言更新
  ipcMain.on('update-tray-language', (_event, language: string) => {
    updateTrayMenu(language);
    // 廣播語言更改到所有窗口（包括搜索框）
    if (win && !win.isDestroyed()) {
      win.webContents.send('language-changed', language);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('language-changed', language);
    }
  });
  
  // 注册全局快捷键
  const shortcut = 'Alt+Space'; // 可改
  registerGlobalShortcut(shortcut);
  // 注册Esc关闭搜索框
  globalShortcut.register('Escape', () => {
    if (win && win.isVisible()) {
      win.hide();
    }
  });
  // 注册Ctrl+Q退出应用
  globalShortcut.register('CommandOrControl+Q', () => {
    isQuitting = true;
    app.quit();
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
  // 當所有窗口關閉時，不退出應用（因為有系統托盤）
  // macOS 上通常應用不會完全退出
  // 其他平台也保持運行在托盤中
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // 設置退出標誌，允許窗口真正關閉
  isQuitting = true;
  //注销快捷键
  globalShortcut.unregisterAll()
  // 清理托盤
  if (tray) {
    tray.destroy();
  }
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