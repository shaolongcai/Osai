import { useEffect, useState } from "react";
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { I18nProvider } from './contexts/I18nContext';
import { NotificationsProvider } from '@toolpad/core/useNotifications';



// Provider 初始化与订阅（示例）
function RootProviders({ children }) {
    const [lang, setLang] = useState('zh-CN');

    // useEffect(() => {
    //     window.electronAPI.getConfig('app_language').then(setLang);
    //     const off = window.electronAPI.onLanguageChanged((l) => setLang(l));
    //     return () => { /* 如果暴露了移除监听就调用 */ };
    // }, []);

    return (
        <I18nProvider defaultLanguage={lang}>
            <ThemeProvider theme={theme}>
                <NotificationsProvider>
                    {children}
                </NotificationsProvider>
            </ThemeProvider>
        </I18nProvider>
    );
}

export default RootProviders;