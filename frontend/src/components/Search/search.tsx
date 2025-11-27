import { Button, Paper, Stack, TextField, Typography } from "@mui/material"
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
        elevation={0}
        className="p-4 rounded-xl shadow-sm border border-border box-border transition-all duration-200 hover:border-border-light hover:shadow-md w-full"
        sx={{
            // minWidth: '480px',
        }}
    >
        <Stack direction="row" spacing={2} alignItems="center">
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
                            padding: '0',
                            color: '#666F8D'
                        }
                    },
                }}
            />
            <Button
                onClick={aiSearch}
            // loading={loading}
            // variant="contained"
            // color="primary"
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