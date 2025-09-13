import { Box, Button, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material"
import React, { useCallback, useEffect, useState } from "react";
import styles from './home.module.scss'
import { Search, InfoCard } from '@/components';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { Progress, searchItem } from "@/type/electron";
import readySearchImage from '@/assets/images/search-ready.png'
import { Notification } from '@/type/electron';

const Home = () => {

  const [indexProgress, setIndexProgress] = useState<Progress | null>(); //索引的进度信息
  const [needIndexImageCount, setNeedIndexImageCount] = useState<number | null>(null); //剩下需要索引的图片
  const [keyword, setKeyword] = useState(''); //搜索的关键词
  const [data, setData] = useState<searchItem[]>([]); //搜索的结果

  // 检查是否在Electron环境中
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  useEffect(() => {
    // 监听索引进度
    window.electronAPI.onIndexProgress(async (data) => {
      setIndexProgress(data);
    });
    // 监听视觉索引进度
    window.electronAPI.onVisualIndexProgress(async (data) => {
      setNeedIndexImageCount(data.count);
    });
    return () => {
      // 移除监听
      window.electronAPI.removeAllListeners('index-progress');
      window.electronAPI.removeAllListeners('visual-index-progress');
    };
  }, []);


  const searchFiles = useCallback(async (keyword: string) => {
    const res = await window.electronAPI.searchFiles(keyword);
    setData(res)
  }, []);

  // 触发搜索
  useEffect(() => {
    if (keyword) {
      searchFiles(keyword);
    }
    else {
      setData([]);
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


  const columns: ColumnData[] = [
    {
      width: 60,
      label: '文件名称',
      dataKey: 'name',
      styles: {
        fontColor: '#00000085',
      }
    },
    {
      width: 100,
      label: '路径',
      dataKey: 'path',
      styles: {
        fontColor: '#00000065',
      }
    },
    // {
    //   width: 50,
    //   label: 'Age',
    //   dataKey: 'age',
    //   numeric: true,
    // },
  ];


  const VirtuosoTableComponents: TableComponents<DataItem> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
      <TableContainer component={Paper} {...props} ref={ref}
        sx={{
          boxShadow: 'none',
          border: 'none',
          // 使用 ::-webkit-scrollbar 系列伪元素来自定义滚动条
          // 这些样式会覆盖浏览器默认的滚动条外观
          '&::-webkit-scrollbar': {
            width: '6px', // 滚动条宽度
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent', // 轨道背景透明
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)', // 滑块颜色
            borderRadius: '3px', // 滑块圆角
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // 鼠标悬停时滑块颜色变深
          },
        }}
      />
    )),
    Table: (props) => (
      <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
    ),
    TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
      <TableHead {...props} ref={ref} />
    )),
    TableRow,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
      <TableBody {...props} ref={ref}
        sx={{
          '& .MuiTableRow-root:hover': {
            backgroundColor: '#1890FF25', // 应用您想要的蓝色背景
            cursor: 'pointer',
            // transition: 'background-color 0.1s ease',

            // b. 为该行的第一个单元格设置左侧圆角
            '& .MuiTableCell-root:first-of-type': {
              borderRadius: '8px 0 0 8px',
            },
            // c. 为该行的最后一个单元格设置右侧圆角
            '& .MuiTableCell-root:last-of-type': {
              borderRadius: '0 8px 8px 0',
            },
          },
        }}
      />
    )),
  };

  // 表格内容
  function rowContent(_index: number, row: DataItem) {
    return (
      <React.Fragment>
        {columns.map((column) => (
          <TableCell
            key={column.dataKey}
            align={column.numeric || false ? 'right' : 'left'}
            sx={{
              borderBottom: 'none',
              p: '8px', //row内边距
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: column.styles?.fontColor,
            }}
          >
            {row[column.dataKey]}
          </TableCell>
        ))}
      </React.Fragment>
    );
  }

  // 固定的表头
  function fixedHeaderContent() {
    return (
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.dataKey}
            variant="head"
            align={column.numeric || false ? 'right' : 'left'}
            style={{ width: column.width }}
            sx={{
              backgroundColor: 'background.paper',
              borderBottom: 'none',
              // borderRight: '1px solid #cccccc',
              height: '8px',
              fontSize: '14px',
              color: '#00000085',
              fontWeight: 600,
              p: '8px',
            }}
          >
            {column.label}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  // 模拟message
  const notifications: Notification[] = [
    {
      text: '检测到GPU',
      type: 'warning',
      tooltip: '没有检查到任何可用GPU，将使用CPU进行推理，但速度会有所降低',
    },
    {
      text: '正在下载AI模型',
      type: 'loading',
    },
    {
      text: '视觉服务已就绪',
      type: 'pending',
    },
     {
      text: '视觉索引服务已启动 剩余 34,000',
      type: 'loadingQuestion',
      tooltip: '视觉服务：你可以直接搜索图片中的内容，而不仅是名称。你可前往【设置】手动关闭',
    },
  ]

  return (
    <div className={styles.root}>
      <Search onSearch={setKeyword} />
      {
        data.length > 0 ?
          <Box className={styles.table}>
            <TableVirtuoso
              fixedHeaderContent={fixedHeaderContent}
              data={data}
              components={VirtuosoTableComponents}
              itemContent={rowContent}
            />
          </Box>
          :
          <Stack className={styles.indexRoot} alignItems='center' spacing={1}>
            <img src={readySearchImage} alt='' />
            {
              indexProgress?.process !== 'finish' &&
              <LinearProgress className={styles.progress} />
            }
            <Typography className={styles.text} variant='body1'>
              {indexProgress ? indexProgress.message : '正在索引'}
            </Typography>
            <Typography className={styles.text} variant='body1'>
              你可以随时进行搜索
            </Typography>
          </Stack>
      }
      <Button onClick={indexFiles}>
        索引
      </Button>
      <Typography>
        {needIndexImageCount}
      </Typography>
      <Box sx={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
      }}>
        <InfoCard notifications={notifications} />
      </Box>
    </div>
  )
}

export default Home