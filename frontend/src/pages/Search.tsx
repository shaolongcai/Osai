import { useState, useEffect, useCallback } from 'react';
import { Cate, InfoCard, Search, SearchPanel } from "@/components";
import { Button, Card, Stack, Typography } from '@mui/material';
import { useDebounce, useRequest } from 'ahooks';
import AISeverImage from '@/assets/images/AI-sever.png'
import { FileCate } from '@/utils/enum';
import { useTranslation } from '@/i18n';


const SearchBar = () => {
    const { t } = useTranslation();

    const [data, setData] = useState<shortSearchDataItem[]>([]); //搜索的结果
    const [selectedIndex, setSelectedIndex] = useState<number>(0); // 当前选中的项目索引
    const [searchValue, setSearchValue] = useState(''); //搜索的关键词
    const [selectedCategory, setSelectedCategory] = useState<FileCate>(FileCate.ALL); // 当前选中的分类
    const [isShowAiServerTips, setIsShowAiServerTips] = useState<boolean>(false); // 是否显示AI服务提示

    const debounceSearch = useDebounce(searchValue, { wait: 200 });

    // 当搜索关键词变化时触发快捷搜索
    useEffect(() => {
        onSearch(debounceSearch, selectedCategory);
    }, [debounceSearch, selectedCategory]);

    // 处理键盘导航
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const categories = Object.values(FileCate);
        const currentCategoryIndex = categories.indexOf(selectedCategory);

        // 处理左右键切换分类（仅在搜索框有内容时）
        if (debounceSearch.length > 0) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                // 切换到上一个分类
                if (currentCategoryIndex > 0) {
                    setSelectedCategory(categories[currentCategoryIndex - 1]);
                } else {
                    // 如果已经在第一个，循环到最后一个
                    setSelectedCategory(categories[categories.length - 1]);
                }
                return;
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                // 切换到下一个分类
                if (currentCategoryIndex < categories.length - 1) {
                    setSelectedCategory(categories[currentCategoryIndex + 1]);
                } else {
                    // 如果已经在最后一个，循环到第一个
                    setSelectedCategory(categories[0]);
                }
                return;
            }
        }

        // 处理上下键切换搜索结果（仅在搜索结果存在时）
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
    }, [data, selectedIndex, selectedCategory, debounceSearch.length]);

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

    // 語言更改由 RootProviders 和 I18nProvider 統一管理
    // 不需要在這裡單獨監聯，因為語言變化會通過 React Context 自動傳遞

    // 开始索引
    useRequest(window.electronAPI.startIndex)

    // 快捷搜索
    const onSearch = async (keyword: string, category: string = 'ALL') => {
        const res = await window.electronAPI.shortSearch(keyword, category);
        console.log('快捷搜索结果', res);
        setData(res.data);
        setSelectedIndex(0); // 重置选中状态到搜索框
    }

    // 处理选中索引变化（来自hover或其他交互）
    const handleSelectedIndexChange = useCallback((index: number) => {
        setSelectedIndex(index);
    }, []);


    // 处理引导AI服务提示
    const handelShowAiServerTips = useCallback(() => {
        // 不檢查 localStorage，允許用戶多次查看
        setIsShowAiServerTips(true);
    }, []);

    // 处理设置AI服务提供商
    const handleSetAiProvider = useCallback(() => {
        // 跳转到设置页面
        setIsShowAiServerTips(false);
        // TODO: 導航到設置頁面的 AI 提供商設置
        // 可以通過 window.electronAPI 發送消息或使用路由
    }, []);

    // 处理关闭AI服务提示（点击 Later）
    const handleCloseAiServerTips = useCallback(() => {
        setIsShowAiServerTips(false);
        // 只在用戶點擊 Later 時才標記為已顯示，避免重複提示
        localStorage.setItem('hasShowedAiServerTips', 'true');
    }, []);


    return <Stack spacing={1} >
        {
            // 分类
            debounceSearch.length > 0 &&
            <Cate onClick={setSelectedCategory} currentCate={selectedCategory} />
        }
        <Search onSearch={setSearchValue} />
        {
            debounceSearch.length > 0 && !isShowAiServerTips &&
            <SearchPanel
                data={data}
                selectedIndex={selectedIndex}
                onSelectedIndexChange={handleSelectedIndexChange}
                showAiServerTips={handelShowAiServerTips}
            />
        }
        {
            isShowAiServerTips &&
            <Card>
                <Stack spacing={2} alignItems='center'>
                    <Typography variant='titleMedium' className='w-full'>
                        {t('app.aiSever.title')}
                    </Typography>
                    <img src={AISeverImage} className='w-45 h-45' alt="AI Service" />
                    <Typography variant='bodyLarge' color='text.primary' className='whitespace-pre-line leading-relaxed! '>
                        {t('app.aiSever.description')}
                    </Typography>
                    <Stack spacing={1} alignItems='center'>
                        <Button variant='contained' onClick={handleSetAiProvider} fullWidth={false} className='w-fit'>
                            {t('app.aiSever.goToSet')}
                        </Button>
                        <Button variant='outlined' onClick={handleCloseAiServerTips} fullWidth={false} className='w-fit'>
                            {t('app.aiSever.later')}
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        }
        <InfoCard />
    </Stack>
}

export default SearchBar;