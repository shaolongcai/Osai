import { useState } from 'react'
import './App.css'
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { globalContext } from '@/context/globalContext';
import { GpuInfo } from './type/electron';
import Preload from './pages/preload/Preload';
import Home from './pages/home/Home'
import { Routes, Route, HashRouter } from 'react-router-dom';

function App() {

  const [gpuInfo, setGpuInfo] = useState<GpuInfo>({
    hasGPU: false,
    memory: 0,
    hasDiscreteGPU: false,
  })

  return (
    <NotificationsProvider slotProps={{
      snackbar: {
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
      },
    }}>
      <globalContext.Provider value={{
        gpuInfo,
        setGpuInfo
      }}>
        <HashRouter>
          <Routes>
            <Route path='/' element={<Preload />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </HashRouter>
      </globalContext.Provider>
    </NotificationsProvider>
  )
}

export default App
