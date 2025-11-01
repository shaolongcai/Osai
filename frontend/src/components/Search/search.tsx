import { Button, Paper, Stack, TextField, Typography } from "@mui/material"
import styles from './search.module.scss'
import { useState } from "react";
import { useTranslation } from '@/contexts/I18nContext';


interface Props {
    onSearch: (keyword: string) => void;
}

const Search: React.FC<Props> = ({
    onSearch,
}) => {

    const [searchValue, setSearchValue] = useState(''); //搜索的关键词
    const { t } = useTranslation();

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
        elevation={0}
        className={styles.root}
        sx={{
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0px 2px 4px rgba(25, 33, 61, 0.08)',
            border: '1px solid #F0F2F5',
            width: '100%',
        }}
    >
        <Stack direction="row" spacing={2} alignItems="center">
            <TextField
                slotProps={{
                    htmlInput: {
                        autoComplete: 'off',
                        autoFocus: true,
                    }
                }}
                className={styles.input}
                fullWidth
                placeholder={t('app.search.placeholder')}
                variant="outlined"
                // value={question}
                onChange={(event) => handleSearch(event.target.value)}
                // onKeyDown={handleKeyDown}
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
                            padding: '0', // 修改内边距
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