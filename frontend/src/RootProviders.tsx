import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { I18nProvider, SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { globalContext } from '@/contexts/globalContext';
import { GpuInfo } from "./types/electron";


// Provider 初始化与订阅
function RootProviders({ children }) {
    // 從 localStorage 讀取初始語言
    const getInitialLanguage = (): Language => {
        const saved = localStorage.getItem('app-language') as Language;
        if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
            return saved;
        }
        return 'zh-CN';
    };

    // 使用 key 來強制重新掛載 I18nProvider
    const [i18nKey, setI18nKey] = useState(0);
    const [initialLang, setInitialLang] = useState<Language>(getInitialLanguage);
    // 使用 ref 追蹤當前窗口實際使用的語言（避免與其他窗口共享的 localStorage 衝突）
    const currentLangRef = useRef<Language>(initialLang);

    // 監聽來自 Electron 主進程的語言更改事件（當其他窗口變更語言時）
    useEffect(() => {
        if (typeof window !== 'undefined' && window.electronAPI) {
            // 監聯語言更改
            window.electronAPI.onLanguageChanged((newLang: string) => {
                console.log('RootProviders 收到語言更改通知:', newLang, '當前語言:', currentLangRef.current);
                // 只有當語言真正改變時才重新掛載，避免無限循環
                // 比較的是當前窗口實際使用的語言，而不是 localStorage（因為 localStorage 是共享的）
                if (SUPPORTED_LANGUAGES.includes(newLang as Language) && newLang !== currentLangRef.current) {
                    console.log('語言不同，更新 I18nProvider');
                    // 更新當前窗口的語言追蹤
                    currentLangRef.current = newLang as Language;
                    // 同步到 localStorage
                    localStorage.setItem('app-language', newLang);
                    // 更新 initialLang 以便重新掛載時使用新語言
                    setInitialLang(newLang as Language);
                    // 強制重新掛載 I18nProvider 以應用新語言
                    setI18nKey(prev => prev + 1);
                }
            });

            return () => {
                window.electronAPI.removeAllListeners('language-changed');
            };
        }
    }, []);

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
        <I18nProvider key={i18nKey} defaultLanguage={initialLang}>
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
