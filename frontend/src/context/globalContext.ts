import { GpuInfo } from '@/type/electron';
import { createContext, useContext } from 'react';



export interface IGlobalContext {
    gpuInfo: GpuInfo,
    setGpuInfo: React.Dispatch<React.SetStateAction<GpuInfo>>
}

// 创建全局上下文
export const globalContext = createContext<IGlobalContext>({
    gpuInfo: {
        hasGPU: false,
        memory: 0,
        hasDiscreteGPU: false,
    } as GpuInfo,
    setGpuInfo: () => { },
});


// 自定义Hook用于使用Context
export const useGlobalContext = (): IGlobalContext => {
    const context = useContext(globalContext)
    if (context === undefined) {
        throw new Error('useGlobalContext must be used within a GlobalProvider')
    }
    return context
}