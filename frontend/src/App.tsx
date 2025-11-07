import { useState } from 'react'
import './App.css'
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { globalContext } from '@/contexts/globalContext';
import { GpuInfo } from './types/electron';
import Preload from './pages/preload/Preload';
import Home from './pages/home/Home2';
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { Routes, Route, HashRouter } from 'react-router-dom';
import { OsType } from './types/system';
import { I18nProvider } from './contexts/I18nContext';
import { Language } from './types/i18n';

function App() {

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

  // 從 localStorage 讀取保存的語言設置，如果沒有則使用中文簡體作為默認值
  const getSavedLanguage = (): Language => {
    const savedLanguage = localStorage.getItem('app-language');
    return (savedLanguage as Language) || 'zh-CN';
  };

  return (
    <I18nProvider defaultLanguage={getSavedLanguage()}>
      <NotificationsProvider slotProps={{
        snackbar: {
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
        },
      }}>
        <ThemeProvider theme={theme}>
          <globalContext.Provider value={{
            os: getOs(),
            gpuInfo,
            setGpuInfo,
            isReadyAI,
            setIsReadyAI,
          }}>
            <HashRouter>
              <Routes>
                <Route path='/' element={<Preload />} />
                <Route path="/home" element={<Home />} />
              </Routes>
            </HashRouter>
          </globalContext.Provider>
        </ThemeProvider>
      </NotificationsProvider>
    </I18nProvider>
  )
}

export default App
