import { GpuInfo } from '@/type/electron';
import { OsType } from '@/type/system';
import { createContext, useContext } from 'react';



export interface IGlobalContext {
    os: OsType,
    gpuInfo: GpuInfo,
    setGpuInfo: (gpuInfo: GpuInfo) => void,
    isReadyAI: boolean,
    setIsReadyAI: (isReadyAI: boolean) => void,
}

// 创建全局上下文
export const globalContext = createContext<IGlobalContext>({
    os: 'unknown',
    gpuInfo: {
        hasGPU: false,
        memory: 0,
        hasDiscreteGPU: false,
    },
    setGpuInfo: () => { },
    isReadyAI: false,
    setIsReadyAI: () => { },
});


// 自定义Hook用于使用Context
export const useGlobalContext = (): IGlobalContext => {
    const context = useContext(globalContext)
    if (context === undefined) {
        throw new Error('useGlobalContext must be used within a GlobalProvider')
    }
    return context
}