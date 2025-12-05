import { app, BrowserWindow, globalShortcut, screen, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { getConfig, initializeDatabase, setConfig } from './database/sqlite.js';
import { initializeFileApi } from './api/file.js';
import { indexAllFilesWithWorkers } from './core/indexFiles.js';
import { logger } from './core/logger.js';
import { checkGPU, reportErrorToWechat } from './core/system.js';
import { checkModelService } from './core/model.js'
import { ollamaService } from './sever/ollamaSever.js';
import { INotification, INotification2 } from './types/system.js';
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
let tray: Tray | null = null;
let mainWindow: BrowserWindow | null;
let searchWindow: BrowserWindow | null;
let settingsWindow: BrowserWindow | null;


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
        if (searchWindow) {
          // centerOnCurrentDisplay();
          searchWindow.show();
          searchWindow.focus();
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: t.settings,
      click: () => {
        if (settingsWindow) {
          settingsWindow.show();
          settingsWindow.focus();
          settingsWindow.webContents.send('navigate-to-settings');
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
        if (searchWindow) {
          // centerOnCurrentDisplay();
          searchWindow.show();
          searchWindow.focus();
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
      if (searchWindow) {
        if (searchWindow.isVisible()) {
          searchWindow.hide();
        } else {
          // centerOnCurrentDisplay();
          searchWindow.show();
          searchWindow.focus();
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
    setConfig('aiModel_installed', modelExists);
    // 检查CUDA安装包是否未解压
    // const cudaInfo = await checkCUDA();
    // const isInstallCuda = getConfig('cuda_installed');

    // 显示设置窗口
    if (settingsWindow) {
      settingsWindow.show();
    }
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
      await indexAllFilesWithWorkers();
    }
    else {
      logger.info(`缓存期间无需索引`);
      // 无需重新索引，直接获取数据库的数据返回
      const last_index_file_count = getConfig('last_index_file_count');
      const formattedTotal = last_index_file_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); //加入千分位
      const notification: INotification2 = {
        id: 'indexTask',
        messageKey: 'app.search.indexFile',
        variables: { count: formattedTotal },
        type: 'success',
      }
      sendToRenderer('system-info', notification)
    }
    // 索引最近访问的文件 （进测试时启用）
    // await indexImagesService();
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
app.whenReady().then(async () => {
  const { windowManager } = await import('./core/WindowManager.js');
  searchWindow = windowManager.searchWindow;
  settingsWindow = windowManager.settingsWindow;
  // 初始化窗口
  // createWindows();
  createTray(); // 創建系統托盤
  // 初始化API
  initializeFileApi(mainWindow);
  initializeUpdateApi()
  initializeSystemApi()

  // 監聽托盤菜單語言更新
  ipcMain.on('update-tray-language', (_event, language: string) => {
    updateTrayMenu(language);
    // 廣播語言更改到所有窗口（包括搜索框）
    if (windowManager.searchWindow && !windowManager.searchWindow.isDestroyed()) {
      windowManager.searchWindow.webContents.send('language-changed', language);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('language-changed', language);
    }
  });

  // 注册全局快捷键
  const shortcut = 'Alt+Space'; // 可改
  registerGlobalShortcut(shortcut, windowManager);
  // 注册Esc关闭搜索框
  globalShortcut.register('Escape', () => {
    if (windowManager.searchWindow && windowManager.searchWindow.isVisible()) {
      windowManager.hideAllWindows();
    }
  });
  // 注册Ctrl+Q退出应用
  globalShortcut.register('CommandOrControl+Q', () => {
    isQuitting = true;
    app.quit();
  });
})

// 防止多开
app.on('second-instance', () => {
  if (searchWindow) {
    if (!searchWindow.isVisible()) searchWindow.show();
    searchWindow.focus();
  }
  // 防止多開：請求單實例鎖
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    // 如果獲取鎖失敗，說明已經有另一個實例在運行
    logger.info('應用已在運行，退出當前實例');
    app.quit();
  } else {
    logger.info('檢測到第二個實例啟動，激活現有窗口');
    // 如果主窗口存在，顯示並聚焦
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    // 如果搜索框存在，顯示並聚焦（先居中再顯示）
    if (searchWindow) {
      if (!searchWindow.isVisible()) {
        // centerOnCurrentDisplay();
        searchWindow.show();
      }
      searchWindow.focus();
    }
  }
})

app.on('window-all-closed', () => {
  // 當所有窗口關閉時，不退出應用（因為有系統托盤）
  // macOS 上通常應用不會完全退出
  // 其他平台也保持運行在托盤中
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
  ollamaService.stop();
});



//----- 触发事件 ---- 
export const sendToRenderer = (channel: string, data: any) => {
  // 广播事件到所有窗口
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
  if (searchWindow && !searchWindow.isDestroyed()) {
    searchWindow.webContents.send(channel, data);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send(channel, data);
  }
};


// 注册全局快捷键
const registerGlobalShortcut = (shortcut: string, windowManager: any) => {
  globalShortcut.register(shortcut, () => {
    if (windowManager.searchWindow.isVisible()) {
      windowManager.hideAllWindows();
    } else {
      // centerOnCurrentDisplay();
      windowManager.showAllWindows();
      searchWindow.focus();  // 先确保窗口获得焦点，再下发聚焦事件
      searchWindow.webContents.focus(); //只发给search窗口
    }
  });
}