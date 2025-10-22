import { Box, Checkbox, Chip, FormControlLabel, LinearProgress, Paper, Stack, Tooltip, Typography } from "@mui/material"
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from './home.module.scss'
import { Search, InfoCard, Setting, Contact, Dialog, TableRelust } from '@/components';
import { Progress } from "@/type/electron";
import readySearchImage from '@/assets/images/search-ready.png'
import { getFileTypeByExtension } from "@/utils/tools";
import {
  SettingsOutlined as SettingsIcon
} from "@mui/icons-material";
import searchNull from '@/assets/images/search-null.png'
import AIMarkDialog from "@/components/AIMarkDialog/AIMarkDialog";
import { useGlobalContext } from "@/context/globalContext";



const Home = () => {

  const [indexProgress, setIndexProgress] = useState<Progress | null>(); //索引的进度信息
  const [needIndexImageCount, setNeedIndexImageCount] = useState<string | null>(''); //剩下需要索引的图片
  const [keyword, setKeyword] = useState<string>(''); //搜索的关键词
  const [data, setData] = useState<SearchDataItem[]>([]); //搜索的结果
  const [openSetting, setOpenSetting] = useState(false); //是否打开设置弹窗
  // 统一的排序状态管理
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null });
  const [sortedData, setSortedData] = useState<SearchDataItem[]>([]); // 排序后的数据
  const [openAiMarkDialog, setOpenAiMarkDialog] = useState(false); //是否打开AI mark功能引导弹窗

  // 检查是否在Electron环境中
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const effectRan = useRef(false); // 执行守卫
  const context = useGlobalContext(); // 全局上下文


  useEffect(() => {
    // 监听索引进度
    window.electronAPI.onIndexProgress(async (data) => {
      setIndexProgress(data);
    });
    // 监听视觉索引进度
    window.electronAPI.onVisualIndexProgress(async (data) => {
      setNeedIndexImageCount(data.count as string);
    });
    // 监听AI mark功能是否安装
    window.electronAPI.onAiSeverInstalled(async (data) => {
      setOpenAiMarkDialog(true)
      context.setIsReadyAI(true);
    });
    return () => {
      // 移除监听
      window.electronAPI.removeAllListeners('index-progress');
      window.electronAPI.removeAllListeners('visual-index-progress');
      window.electronAPI.removeAllListeners('ai-server-installed');
    };
  }, []);

  // 初始化node进程,(设置完监听后，再开始初始化)
  useEffect(() => {
    if (effectRan.current) {
      return;
    }
    const init = async () => {
      effectRan.current = true;
      await window.electronAPI.startIndex();
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


  const searchFiles = useCallback(async (keyword: string) => {
    const res = await window.electronAPI.searchFiles(keyword);
    setData(res.data);
  }, []);




  return (
    <div className={styles.root}>
      <AIMarkDialog
        open={openAiMarkDialog}
        onClose={() => setOpenAiMarkDialog(false)}
        currentStep={3}
      />
      <Stack direction='row' alignItems='center' spacing={1} >
        <Search onSearch={setKeyword} />
        <Stack className={styles.settings} fontSize='large' alignItems='center' justifyContent='center'
          onClick={() => setOpenSetting(true)}
        >
          <SettingsIcon className={styles.settingsIcon} />
          <Typography variant='body2' className={styles.text}>
            设置
          </Typography>
        </Stack>
      </Stack>
      {/* 搜索与结果 */}
      {
        data.length > 0 &&
        <Typography className={styles.total}>
          共搜索到 {data?.length} 条结果
        </Typography>
      }
      <Setting open={openSetting} onClose={() => setOpenSetting(false)} />
      {
        data.length > 0 ?
          <TableRelust
            sortedData={sortedData}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
          />
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
                label='Beta 0.3.0'
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