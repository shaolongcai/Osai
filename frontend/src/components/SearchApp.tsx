import { useRef } from 'react';
import { useSize, useRequest } from 'ahooks';

/**
 * @description 搜索應用元件，處理視窗大小調整
 * @param children React 子元件
 * @returns JSX 元素
 */
interface SearchAppProps {
    children: React.ReactNode;
}

const SearchApp: React.FC<SearchAppProps> = ({ children }) => {
    const rootRef = useRef(null);
    const size = useSize(rootRef);

    // 觸發變更窗口大小
    useRequest(() => window.electronAPI.resizeWindow('searchWindow', size), {
        ready: Boolean(size),
        refreshDeps: [size],
    });

    return (
        <div ref={rootRef} className='w-full overflow-hidden'>
            <style>{`
                /* 隐藏滚动条但保持可滚动 */
                ::-webkit-scrollbar {
                    display: none;
                }
                
                /* 适用于Firefox */
                * {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
            `}</style>
            {children}
        </div>
    );
};

export default SearchApp;

