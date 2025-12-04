import { Button, Paper, Stack, TextField } from "@mui/material"
import { useEffect, useRef, useState } from "react";
import { useTranslation } from '@/contexts/I18nContext';

interface Props {
    onSearch: (keyword: string) => void;
}

const Search: React.FC<Props> = ({
    onSearch,
}) => {

    const [searchValue, setSearchValue] = useState(''); //搜索的关键词
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.electronAPI) return;
        window.electronAPI.onFocusSearchInput(() => {
            console.log('聚焦到搜索框');
            requestAnimationFrame(() => inputRef.current?.focus());
        });
        return () => window.electronAPI?.removeAllListeners('focus-search-input');
    }, []);

    const aiSearch = async () => {
        // const result = await window.electronAPI.aiSearch(searchValue);
        // console.log('AI搜索结果:', result);
    }

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchValue(value)
        onSearch(value);
    }

    return <Paper
        id='search-panel'
        elevation={1}
        className="flex items-center h-[72px] p-4 rounded-xl shadow-md transition-all duration-200 box-shadow
        hover:border-border-light 
        hover:shadow-md w-full"
    >
        <Stack direction="row" spacing={2} alignItems="center"  sx={{ width: '100%' }}>
            <TextField
                inputRef={inputRef}
                slotProps={{
                    htmlInput: {
                        autoComplete: 'off',
                        autoFocus: true,
                    }
                }}
                fullWidth
                placeholder={t('app.search.placeholder')}
                variant="outlined"
                value={searchValue}
                onChange={(event) => handleSearch(event.target.value)}
                sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                        height: '56px',
                        '& fieldset': {
                            borderWidth: '0px',
                        },
                        '&:hover fieldset': {
                            borderColor: '#0f5baa',
                        },
                        '&.Mui-focused fieldset': {
                            borderWidth: '0px',
                        },
                        '& .MuiOutlinedInput-input': {
                            padding: '12px 16px',
                            color: '#666F8D'
                        }
                    },
                }}
            />
            <Button
                onClick={aiSearch}
                // loading={loading}
                variant="contained"
                color="primary"
                sx={{
                    whiteSpace: 'nowrap',   // 文字不换行
                    flexShrink: 0,          // 不允许被压缩
                    minWidth: 0,            // 去掉默认 64px 限制，完全按内容撑开
                }}
            // disableElevation
            // onClick={() => { handleSendMessage(question) }}
            // startIcon={<img className='' src={sendIcon} alt='' />}
            // sx={{ minWidth: '100px' }}
            >
                {t('app.search.button')}
            </Button>
        </Stack>
    </Paper>
}

export default Search