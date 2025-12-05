

// 设置配置需要填写的参数
interface ConfigParams {
    key: string, // 配置项的key
    value: any, // 配置项的值
    type?: 'boolean' | 'string' | 'number', // 配置值的类型，默认是string
}

/**
 * 发送消息到前端的channel类型
 */
type ChannelType = 'index-progress' | 'system-info';
