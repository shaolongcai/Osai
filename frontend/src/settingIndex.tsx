import ReactDOM from 'react-dom/client';
import Setting from '@/pages/Setting';
import RootProviders from './RootProviders';
import './index.css'
import SettingApp from './components/SettingApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <SettingApp>
        <RootProviders>
            <Setting />
        </RootProviders>
    </SettingApp>
);

// 禁止root滚动
// document.body.style.overflow = 'hidden';
