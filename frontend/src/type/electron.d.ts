// Electron API类型声明
import { NotificationType } from "@/utils/enum";


/**
 * 接口返回的base响应
 */
export interface BaseResponse<T = any> {
    code: number,
    errMsg?: string,
    data: T
}



export interface Progress {
    count: number,
    message: string,
    process: 'finish' | 'pending' //完成或准备中
}



export type SearchResult = {
    data: SearchDataItem[],
    total: number,
}

// 通知接口
export interface Notification {
    id: string,
    text: string,
    type: NotificationType,
    tooltip?: string
}

// 检查GPU信息的返回
export interface GpuInfo {
    hasGPU: boolean,
    memory: number, //以MB为单位
    hasDiscreteGPU: boolean //是否有独显
}


// 设置配置需要填写的参数
export interface ConfigParams {
    key: string, // 配置项的key
    value: any, // 配置项的值
    type?: 'boolean' | 'string' | 'number', // 配置值的类型，默认是string
}


type OpenDirType = 'runLog' | 'openFileDir'

interface ElectronAPI {

    // 告诉主线程可以初始化 （目的是为了，等监听器全部就绪完毕）
    init(): Promise<BaseResponse>;

    // 获取用户配置
    getConfig(key?: string): Promise<UserConfig>;
    // 设置用户配置,type value的类型
    setConfig(params: ConfigParams): Promise<void>;

    // 搜索相关
    searchFiles(query: string): Promise<SearchResult>

    // 索引相关
    startIndex(): Promise<void>; // 开启索引
    toggleIndexImage(open: boolean): Promise<void>; //开启/关闭视觉索引服务

    // 模型相关
    checkModelExists(): Promise<{ success: boolean }>;

    //操作相关
    openDir(type: OpenDirType, path?: string): Promise<void>;

    // 安装GPU服务
    installGpuServer(): Promise<void>;

    //更新接口
    checkForUpdates(): Promise<boolean>; //手动检查有没有更新

    // 事件监听
    onLogger(callback: (data: string) => void): void;
    onIndexProgress(callback: (data: Progress) => void): void;
    onVisualIndexProgress(callback: (data: Progress) => void): void;
    onSystemInfo(callback: (data: Notification) => void): void;

    // 移除事件监听
    removeAllListeners(channel: string): void;
}

// 实用工具
interface ElectronUtils {
    platform: string;
    isElectron: boolean;
    version: string;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
        electronUtils: ElectronUtils;
    }
}

export { };