import { Button, Paper, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react";


const Home = () => {

  const [progress, setProgress] = useState(''); //索引的进度信息
  const [keyword, setKeyword] = useState(''); //搜索的关键词

  // 检查是否在Electron环境中
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  useEffect(() => {
    // 监听索引进度
    window.electronAPI.onIndexProgress(async (data) => {
      console.log('索引进度:', data);
      setProgress(`已索引 ${data.count} 个文件`);
    });
    // 监听视觉索引进度
    window.electronAPI.onVisualIndexProgress(async (data) => {
      console.log('索引进度:', data);
      // setProgress(`已索引 ${data.count} 个文件`); //@todo 换成 视觉索引的count
    });
    return () => {
      // 移除监听
      window.electronAPI.removeAllListeners('index-progress');
      window.electronAPI.removeAllListeners('visual-index-progress');
    };
  }, []);

  // 触发搜索
  useEffect(() => {

    const searchFiles = async (keyword: string) => {
      const res = await window.electronAPI.searchFiles(keyword);
      console.log(res);
    }

    if (keyword) {
      searchFiles(keyword);
    }
  }, [keyword])

  //索引文件
  const indexFiles = async () => {
    await window.electronAPI.indexFiles();
  }

  // 获取文件数量
  const getFilesCount = async () => {
    const count = await window.electronAPI.getFilesCount();
    console.log('文件数量:', count);
  }

  return (
    <div>
      <Paper
        elevation={0}
        // className={styles.questionPaper}
        sx={{
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0px 2px 4px rgba(25, 33, 61, 0.08)',
          border: '1px solid #F0F2F5',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            // className={styles.input}
            fullWidth
            placeholder="对此知识库进行询问"
            variant="outlined"
            // value={question}
            onChange={(event) => setKeyword(event.target.value)}
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
          // loading={loading}
          // variant="contained"
          // color="primary"
          // disableElevation
          // onClick={() => { handleSendMessage(question) }}
          // startIcon={<img className='' src={sendIcon} alt='' />}
          // sx={{ minWidth: '100px' }}
          >
            发送消息
          </Button>
        </Stack>
      </Paper>
      <Button onClick={indexFiles}>
        索引
      </Button>
      <Button onClick={getFilesCount}>
        获取文件数量
      </Button>
      <Typography>
        {progress}
      </Typography>
    </div>
  )
}

export default Home