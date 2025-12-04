import ReactDOM from 'react-dom/client';
import SearchBar from '@/pages/Search';   // 你的搜索条组件
import { Routes, Route, HashRouter } from 'react-router-dom';
import './index.css'
import RootProviders from './RootProviders';
import Preload from './pages/Preload';



const APP = () => {
    return (
        <RootProviders >
            <HashRouter>
                <Routes>
                    <Route path='/' element={<Preload />} />
                    <Route path="/search" element={<SearchBar />} />
                </Routes>
            </HashRouter>
        </RootProviders>
    )
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<APP />);