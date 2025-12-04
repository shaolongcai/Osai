import ReactDOM from 'react-dom/client';
import Setting from '@/pages/Setting';   // 你的设置组件
import RootProviders from './RootProviders';
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <RootProviders>
        <Setting />
    </RootProviders>
);

// 禁止root滚动
document.body.style.overflow = 'hidden';
