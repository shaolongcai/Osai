import { useState, useEffect, useCallback } from 'react';
import { InfoCard, Search, SearchPanel, UpgradeProTips } from "@/components";
import { Language } from '../types/i18n';
import { Button, Card, Paper, Stack, Typography } from '@mui/material';
import { useDebounce, useRequest } from 'ahooks';
import AISeverImage from '@/assets/images/AI-sever.png'


/**
 * 提示设置AI的文案
 */
const AISeverTipsText = <Typography variant='bodyLarge' color='text.primary' className='whitespace-pre-line leading-relaxed! '>
    {`You can enable AI-enhanced services. Osai will remember your files by a powerful AI model.

    🧠 Document Understanding: With AI's understanding, you can find this document faster and easier.

    🔍 AI auto-tags files—search & find, skip categorizing

    🖼️ understand Image: Truly understanding the content of an image, not just relying on OCR.
                `}
</Typography>


const SearchBar = () => {

    const [data, setData] = useState<shortSearchDataItem[]>([]); //搜索的结果
    const [total, setTotal] = useState<number>(0); // 搜索结果总数
    const [selectedIndex, setSelectedIndex] = useState<number>(0); // 当前选中的项目索引
    const [currentLanguage, setCurrentLanguage] = useState<Language>('zh-CN'); // 當前語言
    const [searchValue, setSearchValue] = useState(''); //搜索的关键词
    const [isShowUpgradeProTips, setIsShowUpgradeProTips] = useState<boolean>(false); // 是否显示升级为pro的tips
    const [isShowAiServerTips, setIsShowAiServerTips] = useState<boolean>(false); // 是否显示AI服务提示

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


    // 处理引导AI服务提示
    const handelShowAiServerTips = useCallback(() => {
        const hasShowed = localStorage.getItem('hasShowedAiServerTips');
        if (hasShowed) return;
        // 标记为已提示, 避免重复提示
        localStorage.setItem('hasShowedAiServerTips', 'true');
        setIsShowAiServerTips(true);
    }, []);

    // 处理设置AI服务提供商
    const handleSetAiProvider = useCallback(() => {
        // 是否有pro
        const isPro = false;
        if (isPro) {
            // 跳转到设置提供商页面
        } else {
            setIsShowUpgradeProTips(true);
            setIsShowAiServerTips(false)
        }
    }, []);

    return <Stack spacing={1}>
        <Search onSearch={setSearchValue} />
        {
            debounceSearch.length > 0 && !isShowUpgradeProTips && !isShowAiServerTips &&
            <SearchPanel
                data={data}
                selectedIndex={selectedIndex}
                onSelectedIndexChange={handleSelectedIndexChange}
                showAiServerTips={handelShowAiServerTips}
            />
        }
        {
            isShowAiServerTips && !isShowUpgradeProTips &&
            <Card>
                <Stack spacing={2} alignItems='center'>
                    <Typography variant='titleMedium' className='w-full'>
                        AI enhanced services
                    </Typography>
                    <img src={AISeverImage} className='w-45 h-45' />
                    {AISeverTipsText}
                    <Stack spacing={1} alignItems='center'>
                        <Button variant='contained' onClick={handleSetAiProvider} fullWidth={false} className='w-fit'>
                            GO TO SET
                        </Button>
                        <Button variant='outlined' onClick={() => { setIsShowAiServerTips(false); }} fullWidth={false} className='w-fit'>
                            Later
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        }
        {
            (isShowUpgradeProTips && !isShowAiServerTips) &&
            <UpgradeProTips onFinish={() => { setIsShowUpgradeProTips(false) }} />
        }
        <InfoCard />
    </Stack>
}

export default SearchBar;