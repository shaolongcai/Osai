import { Stack, LinearProgress, Typography, Button } from "@mui/material"
import { useRef, useEffect, useCallback, useState } from "react";
import initImg from '@/assets/images/init.png'
import initErrorImg from '@/assets/images/init-error.png'
import { useNavigate } from 'react-router-dom';
import { Dialog, ReportProtocol } from "@/components";
import { useGlobalContext } from "@/contexts/globalContext";
import { useTranslation } from '@/contexts/I18nContext';

const Preload = () => {

    const [initError, setInitError] = useState<string | null>(null);
    const [protocolOpen, setProtocolOpen] = useState(false); // 协议弹窗
    const [updateOpen, setUpdateOpen] = useState(false); // 更新弹窗

    // 检查节点
    const [isCheckUpdate, setIsCheckUpdate] = useState(false); //检查版本更新
    const [isCheckProtocol, setIsCheckProtocol] = useState(false); //初始化服务

    const effectRan = useRef(false); // 执行守卫
    const navigate = useNavigate();
    const context = useGlobalContext();
    const { t } = useTranslation();

    // 新增：是否为 Electron 环境
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

    // 检查是否有更新（兼容非 Electron 环境）
    useEffect(() => {
        if (!(window as any).electronAPI) {
            // 非 Electron 环境：跳过更新检查，直接进入协议判断
            setIsCheckUpdate(true);
            return;
        }
        // 监听更新
        window.electronAPI.onUpdateStatus(async (data) => {
            console.log('更新信息', data)
            if (data.isUpdateAvailable) {
                setUpdateOpen(true);
            }
            else {
                setIsCheckUpdate(true);
            }
        });
        window.electronAPI.checkForUpdates();

        return () => {
            // 移除监听
            window.electronAPI.removeAllListeners('update-status');
        };
    }, [isElectron]);

    // 检查是否是否同意报告协议
    useEffect(() => {
        console.log('展示同意协议')
        if (isCheckUpdate) {
            showAgreeProtocol();
        }
    }, [isCheckUpdate]);

    // 初始化准备工作
    useEffect(() => {
        if (isCheckProtocol) {
            if (effectRan.current) {
                return;
            }
            initServer();
        }
    }, [isCheckProtocol]);

    // 初始化服务
    const initServer = useCallback(async () => {
        effectRan.current = true;
        const res = await window.electronAPI.init();
        if (res.code === 0) {
            console.log('initRes', res)
            context.setGpuInfo({
                hasGPU: res.data.hasGPU,
                // hasGPU: false, //测试
                memory: res.data.memory,
                hasDiscreteGPU: res.data.hasDiscreteGPU,
            });
            context.setIsReadyAI(res.data.isReadyAI);
            // context.setIsReadyAI(false); //测试
            // 跳转到首页
            navigate('/home');
        }
        else {
            setInitError(res.errMsg);
        }
    }, [navigate])


    // 展示同意协议
    const showAgreeProtocol = useCallback(async () => {
        try {
            // 是否设置不再提醒
            const notRemindAgain = await window.electronAPI.getConfig('not_remind_again')
            if (notRemindAgain) {
                setIsCheckProtocol(true);
                return;
            }

            // 已设置同意不需要再询问
            const agreeProtocol = await window.electronAPI.getConfig('report_agreement')
            if (agreeProtocol) {
                setIsCheckProtocol(true);
                return
            }

            // 其余情况，展示弹窗
            setProtocolOpen(true);

        } catch (error) {
            console.error('展示同意协议失败', error);
            setIsCheckProtocol(true);
        }
    }, []);

    // 处理更新
    const handleUpdate = useCallback(() => {
        console.log('处理更新')
        window.electronAPI.downloadUpdate();
        setUpdateOpen(false);
        setIsCheckUpdate(true);
    }, []);

    //关闭更新弹窗
    const handleCloseUpdate = useCallback(() => {
        setUpdateOpen(false);
        setIsCheckUpdate(true);
    }, []);

    return (
        <>
            {/* 新版本更新 */}
            <Dialog
                title={t('app.preload.updateTitle')}
                open={updateOpen}
                onClose={handleCloseUpdate}
                primaryButtonText={t('app.preload.updatePrimary')}
                secondaryButtonText={t('app.preload.updateSecondary')}
                onSecondaryButtonClick={handleCloseUpdate}
                onPrimaryButtonClick={handleUpdate}
                maxWidth='xs'
            >
                <Typography variant="body1" align='left'>
                    {t('app.preload.updateContent')}
                </Typography>
            </Dialog>
            {/* 弹窗同意条款 */}
            <ReportProtocol
                open={protocolOpen}
                onClose={() => {
                    setProtocolOpen(false)
                    setIsCheckProtocol(true);
                }}
            />
            <Stack className="my-[240px] mx-auto max-w-[240px]" spacing={1} alignItems="center">
                {
                    initError ? (
                        <Stack spacing={1} alignItems="center">
                            <img src={initErrorImg} className="w-[180px] h-[180px]" />
                            <Typography variant="body1" color="error" align="center">
                                {t('app.preload.initFailed')}
                            </Typography>
                            <Typography variant="body1" color="error" align="center">
                                {initError}
                            </Typography>
                            <Button variant='outlined' onClick={() => isElectron ? (window as any).electronAPI.openDir('runLog') : undefined}>
                                {t('app.preload.openLog')}
                            </Button>
                        </Stack>
                    ) :
                        <>
                            <img src={initImg} className="w-[180px] h-[180px]" />
                            <LinearProgress
                                className="w-full"
                            />
                            <Typography variant="body1" align="center"
                                sx={{
                                    fontWeight: 700,
                                }}>
                                {t('app.preload.loading')}
                            </Typography>
                        </>
                }
            </Stack>
        </>
    )

}

export default Preload