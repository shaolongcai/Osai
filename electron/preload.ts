const { contextBridge, ipcRenderer } = require('electron'); //沙箱环境，这份文件只能使用这个导入方式


// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 检查模型是否存在
    getFilesCount: () => ipcRenderer.invoke('get-files-count'),
    // 打开文件所在位置
    openFileLocation: (filePath: string) => ipcRenderer.invoke('open-file-location', filePath),
    // 搜索文件
    searchFiles: (keyword: string) => ipcRenderer.invoke('search-files', keyword),
    // 告知主线程，前端渲染完毕
    rendererReady: () => ipcRenderer.invoke('renderer-ready'),
    // 切换图片视觉索引开关
    toggleIndexImage: (open: boolean) => ipcRenderer.send('toggle-index-image', open), //send的返回值永远都是void


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