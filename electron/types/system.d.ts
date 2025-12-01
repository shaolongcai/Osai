



/**
 * 检查的GPU信息
 * @returns hasGPU  是否有GPU
 * @returns memory  GPU显存
 */
interface GPUInfo {
    hasGPU: boolean;
    memory: number;
    hasDiscreteGPU: boolean //是否有独立显卡
}

/**
 * 发送的系统通知结构
 * @returns text  通知文本
 * @returns type  通知类型
 * @returns tooltip  通知提示
 */
export interface INotification {
    id: string,
    text: string,
    type: NotificationType,
    tooltip?: string,
}

/**
 * V2版本通知类型
 */
export interface INotification2 {
    id: string,
    text?: string, //临时测试使用
    type: NotificationType,
    tooltip?: string,
    textType: string, //用于识别多语言
    count?: number, //用于显示任务数量
}



export type NotificationType = 'pending' | 'success' | 'warning' | 'loading' | 'loadingQuestion' | 'question' | 'none';



/**
 * 配置名称
 */
export type ConfigName = 'cuda_installed' | 'aiModel_installed';