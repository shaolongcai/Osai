const { contextBridge, ipcRenderer } = require('electron'); //沙箱环境，这份文件只能使用这个导入方式

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 执行AI搜索
    aiSearch: (query: string) => ipcRenderer.invoke('ai-search', query),
    // 告知node 程序，前端渲染进程已准备就绪
    init: () => ipcRenderer.invoke('init'),
    // 开始索引
    startIndex: () => ipcRenderer.invoke('start-index'),
    // 切换图片视觉索引开关
    toggleIndexImage: (open: boolean) => ipcRenderer.send('toggle-index-image', open), //send的返回值永远都是void

    // 搜索相关
    searchFiles: (keyword: string) => ipcRenderer.invoke('search-files', keyword), // 搜索文件
    shortSearch: (keyword: string) => ipcRenderer.invoke('short-search', keyword), // 快捷搜索(快捷键的搜索，仅返回少量数据)

    // 获取图标文件
    getIcon: (iconPath?: string, ext?: string) => ipcRenderer.invoke('get-icon', iconPath, ext), // 获取图标文件的 base64 数据

    // 系统相关
    openDir: (type: string, path: string) => ipcRenderer.send('open-dir', type, path), // 打开目录
    setConfig: (params: ConfigParams) => ipcRenderer.invoke('set-config', params.key, params.value, params.type), // 设置用户配置
    getConfig: (key?: string) => ipcRenderer.invoke('get-config', key),  // 获取用户配置
    installGpuServer: () => ipcRenderer.invoke('install-gpu-server'), // 安装GPU服务
    installAiServer: (withCuda: boolean) => ipcRenderer.invoke('install-ai-server', withCuda), // 安装AI服务(AI Mark),whiteCuda:是否安装CUDA
    updateTrayLanguage: (language: string) => ipcRenderer.send('update-tray-language', language), // 更新托盘菜单语言
    getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'), // 獲取自啟動狀態
    setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled), // 設置自啟動狀態

    // 更新相关
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'), // 检查
    downloadUpdate: () => ipcRenderer.invoke('download-update'),  // 下载

    // 执行AI Mark功能
    aiMark: (filePath: string) => ipcRenderer.invoke('ai-mark', filePath),


    // 日志监听
    onLogger: (callback) => {
        ipcRenderer.on('logger', (event, data) => callback(data));
    },
    // 索引监听
    onIndexProgress: (callback) => {
        ipcRenderer.on('index-progress', (event, data) => callback(data));
    },
    // 视觉索引监听
    onVisualIndexProgress: (callback) => {
        ipcRenderer.on('visual-index-progress', (event, data) => callback(data));
    },
    // 系统运行信息
    onSystemInfo: (callback) => {
        ipcRenderer.on('system-info', (_event, data) => callback(data));
    },
    // 更新状态监听
    onUpdateStatus: (callback) => {
        ipcRenderer.on('update-status', (event, data) => callback(data));
    },
    // AImark组件安装监听
    onAiSeverInstalled: (callback) => {
        ipcRenderer.on('ai-sever-installed', (event, data) => callback(data));
    },
    // 導航到設定頁面監聽
    onNavigateToSettings: (callback) => {
        ipcRenderer.on('navigate-to-settings', (event, data) => callback(data));
    },
    // 語言更改監聽
    onLanguageChanged: (callback) => {
        ipcRenderer.on('language-changed', (event, language) => callback(language));
    },

    
    // 移除事件监听
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

// 暴露一些实用工具
contextBridge.exposeInMainWorld('electronUtils', {
    platform: process.platform,
    isElectron: true,
    version: process.versions.electron
});