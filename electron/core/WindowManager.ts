import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';
/**
 * 管理窗口
 * 左窗口：设置
 * 中窗口：搜索
 * 右窗口：文件内容
 */
class WindowManager {

    private static instance: WindowManager;

    public searchWindow: BrowserWindow; //search 窗口
    public settingsWindow: BrowserWindow; //settings 窗口
    // private static fileContentManager: FileContentManager; //file content 窗口 


    private constructor() {
        this.initAllWindows();
        this.centerOnCurrentDisplay();
        this.centerSettingsWindowOnCurrentDisplay();
    }

    // 初始化所有窗口
    private initAllWindows() {
        this.initSearchWindow();
        this.initSettingsWindow();
    }

    // 初始化search窗口
    private initSearchWindow() {
        this.searchWindow = new BrowserWindow({
            width: 480,
            height: 700,
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
                preload: path.join(__dirname, '../preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });
    }

    // 初始化settings窗口
    private initSettingsWindow() {
        this.settingsWindow = new BrowserWindow({
            width: 480,
            height: 700,
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
                preload: path.join(__dirname, '../preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });
    }

    // 返回实例
    public static getInstance(): WindowManager {
        if (!WindowManager.instance) {
            WindowManager.instance = new WindowManager();
        }
        return WindowManager.instance;
    }

    repositionSidecars() { /* 根据中心窗口重排左右窗口 */ }


    // 计算屏幕居中
    private centerOnCurrentDisplay = () => {
        const cursor = screen.getCursorScreenPoint();
        const dist = screen.getDisplayNearestPoint(cursor).workArea;
        const { width, height } = this.searchWindow.getBounds();
        this.searchWindow.setBounds({
            x: Math.round(dist.x + (dist.width - width) / 2),
            y: Math.round(dist.y + dist.height * 0.25)   // 屏幕 1/4 处
        });
    }

    //计算setting的位置（在search的左侧16px + 480px自身宽度）
    private centerSettingsWindowOnCurrentDisplay = () => {
        const cursor = screen.getCursorScreenPoint();
        const dist = screen.getDisplayNearestPoint(cursor).workArea;
        const { width, height } = this.settingsWindow.getBounds();
        this.settingsWindow.setBounds({
            x: Math.round(dist.x + (dist.width - width) / 2 - 480 - 16),
            y: Math.round(dist.y + dist.height * 0.25)   // 屏幕 1/4 处
        });
    }
    

    destroy() {
        this.searchWindow.destroy();
        this.settingsWindow.destroy();
    }
}

// 导出单例
export const windowManager = WindowManager.getInstance();   
