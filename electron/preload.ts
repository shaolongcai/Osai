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

    // 系统相关
    openDir: (type: string, path: string) => ipcRenderer.send('open-dir', type, path), // 打开目录
    setConfig: (key: string, value: any, type?: string) => ipcRenderer.send('set-config', key, value, type), // 设置用户配置
    getConfig: (key?: string) => ipcRenderer.invoke('get-config', key),  // 获取用户配置
    installGpuServer: () => ipcRenderer.invoke('install-gpu-server'), // 安装GPU服务


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