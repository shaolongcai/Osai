import ReactDOM from 'react-dom/client';
import SearchBar from '@/pages/Search';
import { Routes, Route, HashRouter } from 'react-router-dom';
import './index.css'
import RootProviders from './RootProviders';
import Preload from './pages/Preload';
import SearchApp from './components/SearchApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <SearchApp>
        <RootProviders>
            <HashRouter>
                <Routes>
                    <Route path='/' element={<Preload />} />
                    <Route path="/search" element={<SearchBar />} />
                </Routes>
            </HashRouter>
        </RootProviders>
    </SearchApp>
);