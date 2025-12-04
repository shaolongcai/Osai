import { useCallback, useEffect, useRef, useState } from "react";
import { useGlobalContext } from "@/contexts/globalContext";
import { Dialog, ReportProtocol } from "@/components";
import { useTranslation } from '@/contexts/I18nContext';
import { Button, Paper, Stack, Typography } from "@mui/material";
import initImg from '@/assets/images/init.png'
import initErrorImg from '@/assets/images/init-error.png'


// 是否为 Electron 环境
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;
const Preload = () => {

    const [initError, setInitError] = useState<string | null>(null);
    const [protocolOpen, setProtocolOpen] = useState<boolean>(false);
    const [updateOpen, setUpdateOpen] = useState<boolean>(false); // 是否展示更新弹窗

    const effectRan = useRef(false); // 执行守卫
    const updateResolveRef = useRef<(() => void) | null>(null);
    const protocolResolveRef = useRef<(() => void) | null>(null);
    const context = useGlobalContext();
    const { t } = useTranslation();

    // 初始化
    useEffect(() => {
        const init = async () => {
            // 更新逻辑
            const updatePromise = waitUserCheckUpdate(); // 先绑定更新等待，不让updateResolveRef为null
            await checkUpdate() // 检查更新
            await updatePromise // 等待用户操作更新说明

            // 协议逻辑
            const protocolPromise = waitUserCheckProtocol(); // 先绑定协议等待，不让protocolResolveRef为null
            await showAgreeProtocol()   // 检查同意协议
            console.log('等待用户操作同意协议')
            await protocolPromise
            console.log('开始初始化node进程')
            await initServer()
        }
        init()

        return () => {
            // 移除监听
            window.electronAPI.removeAllListeners('update-status');
        };
    }, [])


    // 检查更新
    const checkUpdate = useCallback(async (): Promise<void> => {
        // if (!(window as any).electronAPI) {
        //     // 非 Electron 环境：跳过更新检查，直接进入协议判断
        //     setIsCheckUpdate(true);
        //     return;
        // }
        window.electronAPI.onUpdateStatus(async (data) => {
            console.log('更新信息', data)
            if (data.isUpdateAvailable) {
                setUpdateOpen(true);
            }
            else {
                updateResolveRef.current?.();
            }
        });
        await window.electronAPI.checkForUpdates(); // 似乎这里可以不需要再监听更新
    }, []);

    // 展示同意协议
    const showAgreeProtocol = useCallback(async (): Promise<void> => {
        try {
            // 是否设置不再提醒
            const notRemindAgain = await window.electronAPI.getConfig('not_remind_again')
            if (notRemindAgain) {
                console.log('已设置同意不需要再询问')
                protocolResolveRef.current?.(); //已经解决，直接继续
                return
            }
            // 已设置同意不需要再询问
            const agreeProtocol = await window.electronAPI.getConfig('report_agreement')
            if (agreeProtocol) {
                console.log('已设置同意协议')
                protocolResolveRef.current?.();
                return
            }
            console.log('未设置同意协议')
            setProtocolOpen(true);
        } catch (error) {
            console.error('展示同意协议失败', error);
            setProtocolOpen(true);
        }
    }, []);

    // 初始化node进程,(设置完监听后，再开始初始化)
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
            // navigate('/home');
        }
        else {
            setInitError(res.errMsg);
        }
    }, [])


    // 等待用户操作更新说明
    const waitUserCheckUpdate = useCallback((): Promise<void> => {
        return new Promise<void>((resolve) => {
            updateResolveRef.current = resolve; // 将resolve存放在ref中，后续直接调用resolve
        });
    }, []);

    // 等待用户操作同意协议的 Promise；作用：在确认前暂停流程
    const waitUserCheckProtocol = useCallback((): Promise<void> => {
        return new Promise<void>((resolve) => {
            protocolResolveRef.current = resolve;
        });
    }, []);

    // 处理更新
    const handleUpdate = useCallback(() => {
        console.log('处理更新')
        window.electronAPI.downloadUpdate();
        setUpdateOpen(false);
        updateResolveRef.current?.();
    }, []);

    const handleCloseUpdate = useCallback(() => {
        setUpdateOpen(false);
        updateResolveRef.current?.();
    }, []);

    return (
        <Paper className="w-[480px] box-border min-h-[400px] flex flex-col items-center justify-center">
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
            <ReportProtocol
                open={protocolOpen}
                onConfirm={() => {
                    setProtocolOpen(false)
                    protocolResolveRef.current?.(); // 同意协议
                }}
                onClose={() => {
                    setProtocolOpen(false)
                    protocolResolveRef.current?.(); // 拒绝协议，也继续
                }}
            />

            {
                !initError ?
                    // 服务启动中 
                    <Stack spacing={1} alignItems={'center'}>
                        <img src={initImg} className="w-[180px] h-[180px]" />
                        <Typography variant="body1" align="center"
                            sx={{
                                fontWeight: 700,
                            }}>
                            {t('app.preload.loading')}
                        </Typography>
                    </Stack>
                    :
                    // 服务启动失败
                    <Stack spacing={1} alignItems="center">
                        <img src={initErrorImg} className="w-[180px] h-[180px]" />
                        <Typography variant="body1" color="error" align="center">
                            {t('app.preload.initFailed')}
                        </Typography>
                        <Typography variant="body1" color="error" align="center">
                            {initError}
                        </Typography>
                        <Button variant='contained' onClick={() => window.location.reload()}>
                            {t('app.preload.retry')}
                        </Button>
                        <Button variant='outlined' onClick={() => isElectron ? (window as any).electronAPI.openDir('runLog') : undefined}>
                            {t('app.preload.openLog')}
                        </Button>
                    </Stack>
            }
        </Paper>
    )
}

export default Preload;