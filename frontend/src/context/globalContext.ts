import { GpuInfo } from '@/type/electron';
import { OsType } from '@/type/system';
import { createContext, useContext } from 'react';



export interface IGlobalContext {
    os: OsType,
}

// 创建全局上下文
export const globalContext = createContext<IGlobalContext>({
    os: 'unknown',
});


// 自定义Hook用于使用Context
export const useGlobalContext = (): IGlobalContext => {
    const context = useContext(globalContext)
    if (context === undefined) {
        throw new Error('useGlobalContext must be used within a GlobalProvider')
    }
    return context
}