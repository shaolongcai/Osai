import { Button, Paper, Stack, TextField, Typography } from "@mui/material"
import styles from './search.module.scss'
import { useState } from "react";


interface Props {
    onSearch: (keyword: string) => void;
}

const Search: React.FC<Props> = ({
    onSearch
}) => {

    const [searchValue, setSearchValue] = useState(''); //搜索的关键词

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
                className={styles.input}
                fullWidth
                placeholder="搜索文件名称或者图片摘要"
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
                搜索
            </Button>
        </Stack>
    </Paper>
}

export default Search