import ReactDOM from 'react-dom/client';
import SearchBar from '@/pages/Search';   // 你的搜索条组件
import { Routes, Route, HashRouter } from 'react-router-dom';
import './index.css'
import RootProviders from './RootProviders';
import Preload from './pages/Preload';
import { useRequest, useSize } from 'ahooks';
import { useRef } from 'react';

const APP = () => {

    const rootRef = useRef(null);
    const size = useSize(rootRef)

    // 触发变更窗口大小
    useRequest(() => window.electronAPI.resizeWindow('searchWindow', size), {
        refreshDeps: [size],
    })

    return (
        <div ref={rootRef}>
            <RootProviders  >
                <HashRouter>
                    <Routes>
                        <Route path='/' element={<Preload />} />
                        <Route path="/search" element={<SearchBar />} />
                    </Routes>
                </HashRouter>
            </RootProviders>
        </div>
    )
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<APP />);