import { useState } from 'react'
import Home from './pages/home/home'
import './App.css'
import { NotificationsProvider, } from '@toolpad/core/useNotifications';
import { globalContext } from '@/context/globalContext';
import { GpuInfo } from './type/electron';

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
        <Home />
      </globalContext.Provider>
    </NotificationsProvider>
  )
}

export default App
