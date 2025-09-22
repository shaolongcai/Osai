import { Box, Chip, LinearProgress, Paper, Stack, Tooltip, Typography } from "@mui/material"
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from './home.module.scss'
import { Search, InfoCard, Setting, Contact } from '@/components';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow, { TableRowProps } from '@mui/material/TableRow';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { Progress } from "@/type/electron";
import readySearchImage from '@/assets/images/search-ready.png'
import dayjs from "dayjs";
import { getFileTypeByExtension } from "@/utils/tools";
import { SettingsOutlined as SettingsIcon, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import searchNull from '@/assets/images/search-null.png'


const Home = () => {

  const [indexProgress, setIndexProgress] = useState<Progress | null>(); //索引的进度信息
  const [needIndexImageCount, setNeedIndexImageCount] = useState<number | null>(null); //剩下需要索引的图片
  const [keyword, setKeyword] = useState<string>(''); //搜索的关键词
  const [data, setData] = useState<SearchDataItem[]>([]); //搜索的结果
  const [openSetting, setOpenSetting] = useState(false); //是否打开设置弹窗
  // 统一的排序状态管理
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null });
  const [sortedData, setSortedData] = useState<SearchDataItem[]>([]); // 排序后的数据

  // 检查是否在Electron环境中
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const effectRan = useRef(false); // 执行守卫


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

  // 初始化node进程,(设置完监听后，再开始初始化)
  useEffect(() => {
    if (effectRan.current) {
      return;
    }
    const init = async () => {
      effectRan.current = true;
      await window.electronAPI.init();
    }
    init();
  }, []);

  // 触发搜索
  useEffect(() => {
    if (keyword) {
      searchFiles(keyword);
    }
    else {
      setData([]);
      setSortedData([]);
      setSortConfig({ key: null, direction: null });
    }
  }, [keyword])

  // 处理数据排序
  // 通用数据排序逻辑
  useEffect(() => {
    if (sortConfig.key && sortConfig.direction && data.length > 0) {
      const sorted = [...data].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        // 根据不同字段进行不同的排序处理
        switch (sortConfig.key) {
          case 'ext':
            aValue = getFileTypeByExtension(a.ext).toLowerCase();
            bValue = getFileTypeByExtension(b.ext).toLowerCase();
            break;
          case 'modified_at':
            aValue = new Date(a.modified_at).getTime();
            bValue = new Date(b.modified_at).getTime();
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'path':
            aValue = a.path.toLowerCase();
            bValue = b.path.toLowerCase();
            break;
          default:
            aValue = a[sortConfig.key as keyof SearchDataItem];
            bValue = b[sortConfig.key as keyof SearchDataItem];
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
      setSortedData(sorted);
    } else {
      setSortedData(data);
    }
  }, [data, sortConfig]);

  // 通用排序处理函数
  const handleSort = (columnKey: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';

    if (sortConfig.key === columnKey) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ key: columnKey, direction });
  };

  const searchFiles = useCallback(async (keyword: string) => {
    const res = await window.electronAPI.searchFiles(keyword);
    setData(res.data);
  }, []);


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
      },
      render: (value) => {
        return <Tooltip title={value}>
          <div style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {value}
          </div>
        </Tooltip>
      },
    },
    {
      width: 50,
      label: '修改时间',
      dataKey: 'modified_at',
      styles: {
        fontColor: '#00000065',
      },
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
      sortable: true
    },
    {
      width: 50,
      label: '文件类型',
      dataKey: 'ext',
      styles: {
        fontColor: '#00000065',
      },
      render: (value) => getFileTypeByExtension(value as string),
      sortable: true // 标记该列可排序
    },
  ];


  const VirtuosoTableComponents: TableComponents<SearchDataItem> = {
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
    TableRow: (props: TableRowProps & { item: SearchDataItem }) => {
      const { item, ...rest } = props;
      const handleRowClick = () => {
        if (item) {
          window.electronAPI.openDir('openFileDir', item.path);
        }
      };
      return <TableRow {...rest} onClick={handleRowClick} />;
    },
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

  // 通用的排序图标渲染函数
  const renderSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return (
        <>
          <ArrowUpward sx={{ fontSize: 12, marginBottom: '-2px', opacity: 0.3 }} />
          <ArrowDownward sx={{ fontSize: 12, opacity: 0.3 }} />
        </>
      );
    }

    if (sortConfig.direction === 'asc') {
      return <ArrowUpward sx={{ fontSize: 14, color: '#1976d2' }} />;
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDownward sx={{ fontSize: 14, color: '#1976d2' }} />;
    }

    return (
      <>
        <ArrowUpward sx={{ fontSize: 12, marginBottom: '-2px', opacity: 0.3 }} />
        <ArrowDownward sx={{ fontSize: 12, opacity: 0.3 }} />
      </>
    );
  };

  // 表格内容
  function rowContent(_index: number, row: SearchDataItem) {
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
            {column.render ? column.render(row[column.dataKey]) : row[column.dataKey]}
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
            onClick={column.sortable ? () => handleSort(column.dataKey) : undefined}
            variant="head"
            align={column.numeric || false ? 'right' : 'left'}
            style={{ width: column.width }}
            sx={{
              cursor: column.sortable ? 'pointer' : 'default',
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
            <Box display="flex" alignItems="center" gap={0.5}>
              {column.label}
              {column.sortable && (
                <Box display="flex" flexDirection="column" sx={{ opacity: 0.6 }}>
                  {renderSortIcon(column.dataKey)}
                </Box>
              )}
            </Box>
          </TableCell>
        ))}
      </TableRow>
    );
  }

  return (
    <div className={styles.root}>
      <Search onSearch={setKeyword} />
      {/* 搜索与结果 */}
      <Stack
        direction='row'
        spacing={1}
        alignItems='flex-end'
        className={styles.settings}
      >
        {
          data.length > 0 &&
          <Typography className={styles.total}>
            共搜索到 {data?.length} 条结果
          </Typography>
        }
        <SettingsIcon
          className={styles.settingsIcon}
          fontSize='large'
          color='inherit'
          onClick={() => setOpenSetting(true)}
        />
      </Stack>
      <Setting open={openSetting} onClose={() => setOpenSetting(false)} />
      {
        data.length > 0 ?
          <Box className={styles.table}>
            <TableVirtuoso
              fixedHeaderContent={fixedHeaderContent}
              data={sortedData}
              components={VirtuosoTableComponents}
              itemContent={rowContent}
            />
          </Box>
          :
          // 若为空，但是有搜索关键词，则显示搜索为空
          keyword.length > 0 ?
            <>
              <Stack className={styles.searchNull} alignItems='center'>
                <img src={searchNull} />
                <Typography variant='body1' className={styles.text}>
                  没搜索到任何结果
                </Typography>
              </Stack>
              <div className={styles.contact}>
                <Contact />
              </div>
            </>
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
              <Chip
                color='primary'
                label='Beta 0.2.0'
                size='medium'
                variant='outlined'
              />
            </Stack>
      }
      <Typography>
        {needIndexImageCount}
      </Typography>
      <Box sx={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
      }}>
        <InfoCard />
      </Box>
    </div>
  )
}

export default Home