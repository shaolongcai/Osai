import { useState } from "react";
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { I18nProvider } from './contexts/I18nContext';
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { globalContext } from '@/contexts/globalContext';
import { GpuInfo } from "./types/electron";


// Provider 初始化与订阅（示例）
function RootProviders({ children }) {
    const [lang, setLang] = useState('zh-CN');

    // useEffect(() => {
    //     window.electronAPI.getConfig('app_language').then(setLang);
    //     const off = window.electronAPI.onLanguageChanged((l) => setLang(l));
    //     return () => { /* 如果暴露了移除监听就调用 */ };
    // }, []);

    const [gpuInfo, setGpuInfo] = useState<GpuInfo>({
        hasGPU: false,
        memory: 0,
        hasDiscreteGPU: false,
    })
    const [isReadyAI, setIsReadyAI] = useState<boolean>(false);

    const getOs = (): OsType => {
        const platform = navigator.platform.toLowerCase();
        if (platform.startsWith('mac')) {
            return 'mac';
        }
        if (platform.startsWith('win')) {
            return 'win';
        }
        return 'unknown';
    };

    return (
        <I18nProvider defaultLanguage={lang}>
            <ThemeProvider theme={theme}>
                <globalContext.Provider value={{
                    os: getOs(),
                    gpuInfo,
                    setGpuInfo,
                    isReadyAI,
                    setIsReadyAI,
                }}>
                    <NotificationsProvider
                        slotProps={{
                            snackbar: {
                                anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
                                sx: {
                                    // width: 400,
                                }
                            },

                        }}>
                        {children}
                    </NotificationsProvider>
                </globalContext.Provider>
            </ThemeProvider>
        </I18nProvider>
    );
}

export default RootProviders;