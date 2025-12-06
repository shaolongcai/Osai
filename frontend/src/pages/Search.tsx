import { useState, useEffect, useCallback } from 'react';
import { InfoCard, Search, SearchPanel } from "@/components";
import { Language } from '../types/i18n';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { useDebounce, useRequest } from 'ahooks';
import UpgradeProImg from '@/assets/images/upgrade.png';

/**
 * 升级为pro的tips
 */
const UpgradeProTips = () => {
    return <Paper className='p-6'>
        <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
            <Typography variant='titleMedium'>
                Upgrade to Pro，Unlock AI Search and More
            </Typography>
            <img src={UpgradeProImg} alt="Upgrade to Pro" className='w-45 h-45' />
            <Typography variant='bodyLarge' color='text.primary' className='text-center whitespace-pre-line leading-relaxed! '>
                {`📌 Agent gradually searches for the files you want.
                    📌 AI will answer your question directly.
                    📌 Experience Beta Features First.
                    And more pro feature coming soon
                `}
            </Typography>
            <Stack>
                <Button variant='contained' onClick={() => { }}>
                    Upgrade to Pro
                </Button>
                <Button variant='outlined' onClick={() => { }}>
                    Login
                </Button>
            </Stack>
        </Stack>
    </Paper>
}


const SearchBar = () => {

    const [data, setData] = useState<shortSearchDataItem[]>([]); //搜索的结果
    const [total, setTotal] = useState<number>(0); // 搜索结果总数
    const [selectedIndex, setSelectedIndex] = useState<number>(0); // 当前选中的项目索引
    const [currentLanguage, setCurrentLanguage] = useState<Language>('zh-CN'); // 當前語言
    const [searchValue, setSearchValue] = useState(''); //搜索的关键词
    const [isShowUpgradeProTips, setIsShowUpgradeProTips] = useState<boolean>(false); // 是否显示升级为pro的tips

    const debounceSearch = useDebounce(searchValue, { wait: 200 });


    // 当搜索关键词变化时触发快捷搜索
    useEffect(() => {
        onSearch(debounceSearch);
    }, [debounceSearch]);

    // 处理键盘导航
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (data.length === 0) return;

        console.log('当前选中索引:', selectedIndex);
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
                    // 向上移动，最小到第一个项目(0)
                    if (prev > 0) {
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

    // 初始化語言設置和監聽語言更改
    useEffect(() => {
        // 從 localStorage 讀取保存的語言設置
        const savedLanguage = localStorage.getItem('app-language') as Language;
        if (savedLanguage) {
            setCurrentLanguage(savedLanguage);
        }

        // 監聽語言更改事件
        if (typeof window !== 'undefined' && window.electronAPI) {
            window.electronAPI.onLanguageChanged((language: string) => {
                console.log('搜索框收到語言更改通知:', language);
                setCurrentLanguage(language as Language);
                // 同步到 localStorage
                localStorage.setItem('app-language', language);
            });

            return () => {
                window.electronAPI.removeAllListeners('language-changed');
            };
        }
    }, []);

    // 开始索引
    useRequest(window.electronAPI.startIndex)

    // 快捷搜索
    const onSearch = async (keyword: string) => {
        const res = await window.electronAPI.shortSearch(keyword);
        console.log('快捷搜索结果', res);
        setData(res.data);
        setTotal(res.total);
        setSelectedIndex(0); // 重置选中状态到搜索框
    }

    // 处理选中索引变化（来自hover或其他交互）
    const handleSelectedIndexChange = useCallback((index: number) => {
        setSelectedIndex(index);
    }, []);


    return <Stack spacing={1}>
        <Search onSearch={setSearchValue} showUpgradeProTips={() => { setIsShowUpgradeProTips(true) }} />
        {
            data.length > 0 && !isShowUpgradeProTips &&
            <SearchPanel
                data={data}
                selectedIndex={selectedIndex}
                onSelectedIndexChange={handleSelectedIndexChange}
            />
        }
        {
            isShowUpgradeProTips &&
            <UpgradeProTips />
        }
        <InfoCard />
    </Stack>
}

export default SearchBar;