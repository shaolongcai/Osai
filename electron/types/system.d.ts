



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
    text: string,
    type: NotificationType,
    tooltip?: string
}

export type NotificationType =  'pending' | 'success' | 'warning' | 'loading' | 'loadingQuestion';