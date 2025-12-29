import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material"
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, InfoCard, Setting, Contact, TableRelust, UpdateTipsDialog } from '@/components';
import { Progress } from "@/types/electron";
import readySearchImage from '@/assets/images/search-ready.png'
import { getFileTypeByExtension } from "@/utils/tools";
import {
  SettingsOutlined as SettingsIcon
} from "@mui/icons-material";
import searchNull from '@/assets/images/search-null.png'
import AIMarkDialog from "@/components/AIMarkDialog/AIMarkDialog";
import { useGlobalContext } from "@/contexts/globalContext";
import { useTranslation } from '@/contexts/useI18n';
import packageJson from '../../../../package.json';

// 版本號常量，方便統一管理
const APP_VERSION = 'Beta 0.4.1';

const Home = () => {

  const { t } = useTranslation();
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
  const [openUpdateTips, setOpenUpdateTips] = useState(false); //是否打开版本更新提示

  // 检查是否在Electron环境中
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const effectRan = useRef(false); // 执行守卫
  const context = useGlobalContext(); // 全局上下文

  //检查版本更新提醒
  useEffect(() => {
    const version = packageJson.version;
    console.log('当前版本:', version);
    console.log('上一次版本:', localStorage.getItem('lastVersion'));
    if (localStorage.getItem('lastVersion') !== version) {
      // 版本更新提醒
      setOpenUpdateTips(true);
    }
    localStorage.setItem('lastVersion', version);
  }, [])


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
      context.setIsReadyAI(true); //告诉全局AI功能已经准备好
    });
    // 监听从托盘菜单打开设定的事件
    window.electronAPI.onNavigateToSettings(() => {
      setOpenSetting(true);
    });
    return () => {
      // 移除监听
      window.electronAPI.removeAllListeners('index-progress');
      window.electronAPI.removeAllListeners('visual-index-progress');
      window.electronAPI.removeAllListeners('ai-server-installed');
      window.electronAPI.removeAllListeners('navigate-to-settings');
    };
  }, [context]);

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
  }, [keyword, searchFiles])

  // 处理数据排序
  // 通用数据排序逻辑
  useEffect(() => {
    if (sortConfig.key && sortConfig.direction && data.length > 0) {
        const sorted = [...data].sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

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
    // console.log('结果', res);
    setData(res.data);
  }, []);




  return (
    <div>
      {/* 版本更新信息提示 */}
      <UpdateTipsDialog
        open={openUpdateTips}
        onClose={() => setOpenUpdateTips(false)}
      />
      {/* AI Mark功能准备完毕提醒 */}
      <AIMarkDialog
        open={openAiMarkDialog}
        onClose={() => setOpenAiMarkDialog(false)}
        currentStep={3}
      />
      <Stack direction='row' alignItems='center' spacing={1} >
        <Search onSearch={setKeyword} />
        <Stack className="w-16 h-16 cursor-pointer" fontSize='large' alignItems='center' justifyContent='center'
          onClick={() => setOpenSetting(true)}
        >
          <SettingsIcon className="w-8 h-8 text-text-secondary" />
          <Typography variant='body2' className="text-text-secondary">
            {t('app.common.settings')}
          </Typography>
        </Stack>
      </Stack>
      {/* 搜索与结果 */}
      {
        data.length > 0 &&
        <Typography className="block absolute bottom-6 right-6 text-sm text-text-secondary">
          {t('app.search.results', { count: data.length })}
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
              <Stack className="mt-40" alignItems='center'>
                <img src={searchNull} className="w-[180px] h-[180px]" />
                <Typography variant='body1' className="text-sm font-semibold text-text-secondary">
                  {t('app.search.noResults')}
                </Typography>
              </Stack>
              <div className="mt-6">
                <Contact />
              </div>
            </>
            :
            <Stack className="w-[180px] my-[180px] mx-auto" alignItems='center' spacing={1}>
              <img src={readySearchImage} alt='' className="w-full" />
              {
                indexProgress?.process !== 'finish' &&
                <LinearProgress className="w-full" />
              }
              <Typography className="font-semibold text-center whitespace-nowrap overflow-hidden text-ellipsis" variant='body1'>
                {indexProgress
                  ? ((indexProgress.process === 'finish' || (indexProgress.message && indexProgress.message.includes('已索引')))
                    ? t('app.indexing.indexed', { count: indexProgress.count })
                    : t('app.indexing.pending'))
                  : t('app.indexing.pending')}
              </Typography>
              <Typography className="font-semibold text-center whitespace-nowrap overflow-hidden text-ellipsis" variant='body1'>
                {t('app.search.start')}
              </Typography>
              <Chip
                color='primary'
                label={APP_VERSION}
                size='medium'
                variant='outlined'
              />
            </Stack>
      }
      <Typography>
        {needIndexImageCount ? t('app.visualIndexStatus.running', { count: needIndexImageCount }) : ''}
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