import { useState, useEffect, useCallback } from 'react';
import styles from './index.module.scss';
import { Search, SearchPanel } from "@/components";
import { I18nProvider } from '../contexts/I18nContext';



const SearchBar = () => {

    const [data, setData] = useState<shortSearchDataItem[]>([]); //搜索的结果
    const [selectedIndex, setSelectedIndex] = useState<number>(-1); // 当前选中的项目索引，-1表示在搜索框


    // 快捷搜索
    const onSearch = async (keyword: string) => {
        const res = await window.electronAPI.shortSearch(keyword);
        console.log('快捷搜索', res);
        setData(res.data);
        setSelectedIndex(-1); // 重置选中状态到搜索框
    }

    // 处理选中索引变化（来自hover或其他交互）
    const handleSelectedIndexChange = useCallback((index: number) => {
        setSelectedIndex(index);
    }, []);

    // 处理键盘导航
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (data.length === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setSelectedIndex(prev => {
                    // 从搜索框(-1)或当前项目向下移动
                    if (prev < data.length - 1) {
                        return prev + 1;
                    }
                    return prev; // 已经在最后一项，保持不变
                });
                break;
            case 'ArrowUp':
                event.preventDefault();
                setSelectedIndex(prev => {
                    // 向上移动，最小到搜索框(-1)
                    if (prev > -1) {
                        return prev - 1;
                    }
                    return prev; // 已经在搜索框，保持不变
                });
                break;
            case 'Enter':
                event.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < data.length) {
                    const selectedItem = data[selectedIndex];
                    console.log('回车选择了', selectedItem.path);
                    window.electronAPI.openDir('openFile', selectedItem.path);
                }
                break;
            case 'Escape':
                // ESC键重置到搜索框
                event.preventDefault();
                setSelectedIndex(-1);
                break;
        }
    }, [data, selectedIndex]);

    // 添加键盘事件监听
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // 当搜索结果为空时，重置选中状态
    useEffect(() => {
        if (data.length === 0) {
            setSelectedIndex(-1);
        }
    }, [data.length]);

    return <I18nProvider defaultLanguage="zh-CN">
        <Search onSearch={onSearch} selectedIndex={selectedIndex} />
        {
            data.length > 0 &&
            <div className={styles.searchPanel}>
                <SearchPanel 
                    data={data} 
                    selectedIndex={selectedIndex} 
                    onSelectedIndexChange={handleSelectedIndexChange}
                />
            </div>
        }
    </I18nProvider>
}

export default SearchBar;