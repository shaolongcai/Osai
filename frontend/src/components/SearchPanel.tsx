import { Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { useIcon } from '@/hooks/useIcon';
import searchNull from '@/assets/images/search-null.png'
import { useTranslation } from "@/contexts/I18nContext";
import { useRequest } from "ahooks";

interface SearchResultItemProps {
    name: string;
    icon?: string;
    ext?: string;
    isSelected?: boolean; // 是否被选中
    isAiMark?: boolean; // 是否为AI文件
    onClick?: () => void; // 点击事件
    onMouseEnter?: () => void; // 鼠标进入事件
    onMouseLeave?: () => void; // 鼠标离开事件
    snippet?: string, // 高亮片段（可选）
    path: string
}
/**
 * 搜索的结果项目
 */
const SearchResultItem: React.FC<SearchResultItemProps> = ({
    name,
    icon,
    ext,
    isAiMark = false,
    snippet,
    isSelected = false,
    onClick,
    onMouseEnter,
    onMouseLeave,
    path,
}) => {

    const { iconSrc } = useIcon(icon, ext);

    return <Paper
        variant='elevation'
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        elevation={0}
        className={`w-full cursor-pointer  transition-colors duration-200  mb-1 
            ${isSelected ? 'bg-linear-to-r! from-blue-50! to-purple-50!' : ''} 
            hover:bg-linear-to-r! hover:from-blue-50! hover:to-purple-50
            px-4 py-2
            max-w-full
        `}
    >
        <Stack direction='row' spacing={1} alignItems="center"
        // className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
        >
            <img src={iconSrc} alt={name} className="w-12 h-12 rounded-lg" />
            <Stack justifyContent='space-between'>
                <Stack direction='row' spacing={1}>
                    <Typography variant='titleMedium'
                        className="font-bold text-text-primary max-w-[340px] overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                        {name}
                    </Typography>
                    {/* {
                        isAiMark && <Chip
                            label='AI Mark'
                            size="small"
                            variant="outlined"
                            color="primary"
                        />
                    } */}
                </Stack>
                <Typography variant='bodySmall' color='textTertiary' className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[380px]">
                    {snippet ? (
                        <span
                            dangerouslySetInnerHTML={{
                                __html: snippet.replace(/<mark>/g, '<mark class="bg-yellow-200 text-gray-900 font-medium px-1">')
                            }}
                        />
                    ) : (
                        <span className="truncate block">{path}</span>
                    )}
                </Typography>
            </Stack>
        </Stack>
    </Paper>
}



interface Props {
    data: shortSearchDataItem[];
    selectedIndex?: number; // 当前选中的索引
    onSelectedIndexChange?: (index: number) => void; // 选中索引变化回调
    showAiServerTips: () => void; // 显示升级为pro的tips
}
const SearchPanel: React.FC<Props> = ({
    data,
    selectedIndex = -1,
    onSelectedIndexChange,
    showAiServerTips,
}) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const { t } = useTranslation();

    // 当选中索引变化时，滚动到对应项目
    useEffect(() => {
        if (selectedIndex >= 0 && selectedIndex < data.length && containerRef.current && itemRefs.current[selectedIndex]) {
            const container = containerRef.current;
            const selectedItem = itemRefs.current[selectedIndex];

            if (selectedItem) {
                // 计算相对于容器的位置
                const containerRect = container.getBoundingClientRect();
                const itemRect = selectedItem.getBoundingClientRect();

                // 计算项目相对于容器内容的位置
                const itemTop = itemRect.top - containerRect.top + container.scrollTop;
                const itemBottom = itemTop + selectedItem.offsetHeight;
                const containerScrollTop = container.scrollTop;
                const containerHeight = container.clientHeight;
                const containerScrollBottom = containerScrollTop + containerHeight;

                // 如果项目顶部接近或超出可视区域上方，滚动到项目顶部
                if (itemTop <= containerScrollTop) {
                    console.log('超出区域')

                    // 如果是第一个项目，滚动到容器顶部
                    if (selectedIndex === 0) {
                        container.scrollTop = 0;
                    } else {
                        container.scrollTop = container.scrollTop - 64;
                    }
                }
                // 如果项目底部接近或超出可视区域下方，滚动到项目底部可见
                else if (itemBottom >= containerScrollBottom) {
                    // 如果是最后一个项目，滚动到容器底部
                    if (selectedIndex === data.length - 1) {
                        container.scrollTop = container.scrollHeight - containerHeight;
                    } else {
                        container.scrollTop = container.scrollTop + 64;
                    }
                }
                // 如果项目在可视区域内且有足够空间，不需要滚动
            }
        }
    }, [selectedIndex, data.length]);

    // 获取AI povider配置
    const { data: aiConfig } = useRequest(() => window.electronAPI.getConfig('ai_provider'),
        {
            onSuccess: res => {
                console.log(res)
            }
        }
    )

    // 处理鼠标悬停
    const handleMouseEnter = (index: number) => {
        if (onSelectedIndexChange) {
            onSelectedIndexChange(index);
        }
    };

    // 处理鼠标离开
    const handleMouseLeave = () => {
        // 鼠标离开时不改变选中状态，保持当前选中
        // 如果需要清除选中状态，可以调用 onSelectedIndexChange(-1)
    };

    return <Paper
        variant='elevation'
        className="
        w-full max-h-[520px] overflow-y-auto! 
        box-border scrollbar-thin
        border border-solid border-[rgba(0,0,0,0.12)]
        py-2
        "
        ref={containerRef}
    >

        {
            data.length > 0 ?
                <Stack alignItems='flex-start' >
                    {
                        data.map((item, index) => (
                            <div
                                style={{
                                    width: '100%'
                                }}
                                key={item.id}
                                ref={(el) => { itemRefs.current[index] = el; }}
                            >
                                <SearchResultItem
                                    isAiMark={item.aiMark === 1}
                                    name={item.name}
                                    icon={item.icon}
                                    ext={item.ext}
                                    path={item.path}
                                    snippet={item.snippet}
                                    isSelected={selectedIndex === index}
                                    onMouseEnter={() => handleMouseEnter(index)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => {
                                        console.log('点击了', item.path);
                                        window.electronAPI.openDir('openFile', item.path);
                                        // 显示引导AI显示tips
                                        showAiServerTips();
                                    }}
                                />
                            </div>
                        ))
                    }
                </Stack>
                :
                <Stack alignItems='center' spacing={2} className="p-4">
                    <img src={searchNull} className="w-[180px] h-[180px]" />
                    <Typography variant='bodyMedium' color='textSecondary' className="text-sm font-semibold text-text-secondary">
                        {t('app.search.noResults')}
                    </Typography>
                    {
                        !Boolean(aiConfig) &&
                        <>
                            <Typography variant='bodyMedium' color='textSecondary'>
                                你可以使用AI增强服务，让AI记住你的文件。
                            </Typography>
                            <Stack spacing={1}>
                                <Button variant='contained' onClick={showAiServerTips}>
                                    Get More
                                </Button>
                            </Stack>
                        </>
                    }
                </Stack>
        }
    </Paper>
}

export default SearchPanel;