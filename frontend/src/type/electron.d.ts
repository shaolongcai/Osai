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
    text: string,
    type: NotificationType,
    tooltip?: string
}


interface ElectronAPI {

    // 搜索相关
    searchFiles(query: string): Promise<searchItem[]>

    // 索引相关
    indexFiles(): Promise<void>;
    getFilesCount(): Promise<number>;

    // 模型相关
    checkModelExists(): Promise<{ success: boolean }>;

    //操作相关
    openFileLocation(relative_file_path: string): Promise<void>;
    openDir(type: string): Promise<void>;

    // 事件监听
    onLogger(callback: (data: string) => void): void;
    onIndexProgress(callback: (data: Progress) => void): void;
    onVisualIndexProgress(callback: (data: Progress) => void): void;

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