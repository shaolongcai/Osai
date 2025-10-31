import { useState } from 'react'
import './App.css'
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { globalContext } from '@/context/globalContext';
import { GpuInfo } from './type/electron';
import Preload from './pages/preload/Preload';
import Home from './pages/home/Home2';
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { Routes, Route, HashRouter } from 'react-router-dom';
import { OsType } from './type/system';
import { I18nProvider } from './contexts/I18nContext';

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

  return (
    <I18nProvider defaultLanguage="zh-CN">
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
