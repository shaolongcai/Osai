import { useRef } from 'react';
import { useSize, useRequest } from 'ahooks';

/**
 * @description 設定應用元件，處理視窗大小調整
 * @param children React 子元件
 * @returns JSX 元素
 */
interface SettingAppProps {
    children: React.ReactNode;
}

const SettingApp: React.FC<SettingAppProps> = ({ children }) => {
    const rootRef = useRef(null);
    const size = useSize(rootRef);

    // 觸發變更窗口大小
    useRequest(() => window.electronAPI.resizeWindow('settingsWindow', size), {
        ready: Boolean(size),
        refreshDeps: [size],
    });

    return (
        <div ref={rootRef}>
            {children}
        </div>
    );
};

export default SettingApp;

