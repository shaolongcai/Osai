// Electron API类型声明
import { NotificationType } from "@/utils/enum";

export interface Progress {
    count: number,
    message: string,
    process: 'finish' | 'pending' //完成或准备中
}

export type searchItem = {
    name: string,
    path: string
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


interface ElectronAPI {

    // 告诉主线程准备完毕
    rendererReady(): Promise<GpuInfo>;

    // 搜索相关
    searchFiles(query: string): Promise<searchItem[]>

    // 索引相关
    openIndex(): Promise<void>; // 开启索引所有硬盘得文件
    toggleIndexImage(open: boolean): Promise<void>; //开启/关闭视觉索引服务

    // 模型相关
    checkModelExists(): Promise<{ success: boolean }>;

    //操作相关
    openDir(type: string, path: string): Promise<void>;

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