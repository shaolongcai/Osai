import { Button, Paper, Stack, Typography, Drawer, Box, Switch, styled, Card } from "@mui/material"
import { useState, useEffect, useContext } from "react";
import {
    Settings as SettingsIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useGlobalContext, globalContext } from "@/contexts/globalContext";
import { SettingItem, Contact, Dialog, ReportProtocol, AIProvider } from "@/components";
import { useTranslation } from '@/contexts/I18nContext';
import { ConfigParams } from '@/types/electron';
import LanguageSwitcher from '@/components/LanguageSwitcher';


// 封装按钮样式
const StyledButton = styled(Button)(({ theme }) => ({
    '&:focus': { outline: 'none', border: 'none', boxShadow: 'none' },
    '&:active': { outline: 'none', border: 'none', boxShadow: 'none' },
    '&:hover': { border: 'none' }
}));


interface SettingButtonProps {
    openSetting: boolean;
    setOpenSetting: (value: boolean) => void;
}
/**
 * 设置按钮
 */
const SettingButton = ({ openSetting, setOpenSetting }: SettingButtonProps) => {
    return <Card
        variant="elevation"
        onClick={() => {
            setOpenSetting(!openSetting);
        }}
        className="rounded-full! flex items-center justify-center cursor-pointer h-10 w-10
        border border-solid border-[rgba(0,0,0,0.12)]
        "
    >
        {
            openSetting ?
                <CloseIcon
                    fontSize='small'
                    sx={{
                        color: 'rgba(0, 0, 0, 0.85)',
                    }} />
                :
                <SettingsIcon
                    fontSize='small'
                    sx={{
                        color: 'rgba(0, 0, 0, 0.85)',
                    }} />
        }
    </Card>
}



/**
 * 设置面板(主界面)
 */
const Setting = () => {

    const [openSetting, setOpenSetting] = useState(false);
    const [openIndexImage, setOpenIndexImage] = useState(Boolean(Number(localStorage.getItem('openIndexImage') || 0)))
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false) //CPU下开启索引的弹窗
    const [openReportProtocol, setOpenReportProtocol] = useState(false) //用户体验改进计划弹窗
    const [hasGPU, setHasGPU] = useState(false)
    const [gpuSeverOpen, setGpuSeverOpen] = useState(false) //GPU服务弹窗
    const [isInstallGpu, setIsInstallGpu] = useState(false) //是否已安装GPU服务
    const [openAIProvider, setOpenAIProvider] = useState(false) //AI服务弹窗
    const [reportAgreement, setReportAgreement] = useState(false) //是否已同意用户体验改进计划
    const [aiProvider, setAiProvider] = useState<{ host: string, model: string }>() //是否已设置AI服务
    // 更新檢查相關狀態
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
    const [latestVersion, setLatestVersion] = useState<string | null>(null)
    const [updateStatusText, setUpdateStatusText] = useState('')
    const [autoLaunch, setAutoLaunch] = useState(false) //是否開機自啟動
    const [autoLaunchHidden, setAutoLaunchHidden] = useState(false) //是否靜默啟動

    const context = useGlobalContext();
    const { t } = useTranslation()

    // 拉取用户配置
    useEffect(() => {
        if (openSetting) {
            window.electronAPI.getConfig().then((res: UserConfig) => {
                console.log('config', res)
                setOpenIndexImage(res.visual_index_enabled)
                setHasGPU(res.hasGPU)
                setIsInstallGpu(res.cuda_installed)
                setReportAgreement(res.report_agreement)
                console.log('ai_provider', JSON.parse(res.ai_provider || '{}').model)
                setAiProvider(JSON.parse(res.ai_provider || '{}'))
            })
            // 獲取自啟動狀態
            window.electronAPI.getAutoLaunch().then((result: { enabled: boolean; openAsHidden: boolean }) => {
                setAutoLaunch(result.enabled)
                setAutoLaunchHidden(result.openAsHidden)
            })
        }
    }, [openSetting])

    // 監聽更新狀態並在抽屜開啟時自動檢查（在非 Electron 環境下跳過）
    useEffect(() => {
        if (!(window as any).electronAPI) {
            // 非 Electron 預覽環境：直接顯示最新版本提示
            setIsCheckingUpdate(false)
            setIsUpdateAvailable(false)
            setLatestVersion(null)
            setUpdateStatusText(t('app.settings.checkUpdateStatusLatest' as any))
            return
        }
        // 僅訂閱事件，不在此自動觸發檢查
        window.electronAPI.onUpdateStatus((data: any) => {
            console.log('update-status', data)
            setIsCheckingUpdate(false)
            if (data && data.isUpdateAvailable) {
                setIsUpdateAvailable(true)
                setLatestVersion(String(data.version || ''))
                setUpdateStatusText(t('app.settings.checkUpdateStatusNewVersion' as any, { version: data.version || '' }))
            } else {
                setIsUpdateAvailable(false)
                setLatestVersion(null)
                // 根据 data.type 映射到对应的多语言 key，确保有默认值兜底
                let msg: string
                switch (data.type) {
                    case 'not-available-update':
                        msg = t('app.settings.not-available-update')
                        break
                    default:
                        msg = t('app.settings.checkUpdateStatusLatest') // 兜底用“已是最新版”
                }
                setUpdateStatusText(msg)
            }
        })
        return () => {
            window.electronAPI.removeAllListeners('update-status')
        }
    }, [open, t])

    const manualCheckUpdate = async () => {
        setIsCheckingUpdate(true)
        setUpdateStatusText(t('app.settings.checking' as any))
        await window.electronAPI.checkForUpdates()
    }

    // 安装GPU服务
    const installGpu = async () => {
        console.log('即将安装GPU服务')
        setGpuSeverOpen(false)
        window.electronAPI.installGpuServer()
        // setIsInstallGpu(true)
    }


    // 切换用户体验改进计划
    const toggleReportAgreement = async (checked: boolean) => {
        if (checked) {
            // 同意用户体验改进计划，需要弹窗
            setOpenReportProtocol(true)
            setOpenSetting(false)
            return
        }
        setReportAgreement(checked)
        const params: ConfigParams = {
            key: 'report_agreement',
            value: checked,
            type: 'boolean',
        }
        // 取消不再提醒
        window.electronAPI.setConfig(params)
        const params2: ConfigParams = {
            key: 'not_remind_again',
            value: false,
            type: 'boolean',
        }
        window.electronAPI.setConfig(params2)
    }

    // 切換自啟動開關
    const toggleAutoLaunch = async (checked: boolean) => {
        setAutoLaunch(checked)
        await window.electronAPI.setAutoLaunch(checked, autoLaunchHidden)
    }

    // 切換靜默啟動開關
    const toggleAutoLaunchHidden = async (checked: boolean) => {
        setAutoLaunchHidden(checked)
        await window.electronAPI.setAutoLaunchHidden(checked)
        // 如果自啟動已開啟，需要更新自啟動設置以包含靜默啟動選項
        if (autoLaunch) {
            await window.electronAPI.setAutoLaunch(true, checked)
        }
    }


    return <>
        {/* 开启GPU服务 */}
        <Dialog
            title={hasGPU ? t('app.settings.gpuService') : '本机没有任何GPU'}
            primaryButtonText={hasGPU ? t('app.common.confirm') : t('app.common.close')}
            onPrimaryButtonClick={() => {
                hasGPU ? installGpu() : setGpuSeverOpen(false)
            }}
            secondaryButtonText={hasGPU && t('app.common.cancel')}
            open={gpuSeverOpen}
            onClose={() => { setGpuSeverOpen(false) }}
            maxWidth='xs'
            fullWidth={false}
        >

            {
                hasGPU ? (
                    <Typography variant='bodyMedium' className='color-rgba(0, 0, 0, 0.85)' >
                        即将安装 GPU 加速服务，可能需要几分钟，请耐心等候。安装完毕后，请重启应用。
                    </Typography>
                ) : (
                    <Typography variant='bodyMedium' className='color-rgba(0, 0, 0, 0.85)' >
                        本机没有GPU/显卡，无法安装 GPU 加速服务。应用将会启动 CPU 索引图片。
                    </Typography>
                )
            }
        </Dialog>
        <Stack
            alignItems='flex-end'
            spacing={3}
            className="mt-4 box-border "
        >
            {/* 设置按钮 */}
            <SettingButton
                openSetting={openSetting}
                setOpenSetting={() => { setOpenSetting(!openSetting), setOpenAIProvider(false), setOpenReportProtocol(false) }}
            />
            {
                // 同意用户体验改进计划弹窗
                openReportProtocol &&
                <ReportProtocol
                    onFinish={() => {
                        setOpenReportProtocol(false)
                        setOpenSetting(true)
                    }}
                />
            }
            {
                openSetting &&
                <Paper
                    className="w-[480px] max-h-[580px]! box-border overflow-y-auto 
                    scrollbar-thin
                    p-6
                    border border-solid border-[rgba(0,0,0,0.12)]
                    "
                >
                    <Typography variant='headlineSmall' >
                        设置
                    </Typography>
                    <Stack spacing={2} sx={{ marginTop: '16px' }}>
                        {/* 当前几乎 */}
                        <Stack spacing={1}>
                            <Typography variant='titleSmall' className='color-rgba(0, 0, 0, 0.85)' >
                                Current Plan
                            </Typography>
                            {/* 账户信息 */}
                            <SettingItem
                                title='Account'
                                type='button'
                                value='login'
                                onAction={() => { console.log('执行登录') }}
                            />
                            {/* pro信息 */}
                            <SettingItem
                                title='Pro'
                                type='text'
                                value='Expire after 2025-08-01'
                            />
                        </Stack>
                        <Stack spacing={1}>
                            <Typography variant='titleSmall' className='color-rgba(0, 0, 0, 0.85)' >
                                AI Sever
                            </Typography>
                            <SettingItem
                                title='AI Provider'
                                type='button'
                                value={aiProvider?.model || 'SET'}
                                onAction={() => {
                                    setOpenAIProvider(true)
                                    setOpenSetting(false)
                                }}
                            // action={<StyledButton
                            //     variant='text'
                            //     onClick={() => { setOpenAIProvider(true), setOpenSetting(false) }} >
                            //         {/* // 暂时只有ollama提供，如果设置了，默认为ollama，即设置的AI Provider */}
                            //     {/* {isInstallGpu ? t('app.settings.reInstall') : t('app.settings.install')} */}
                            //     {aiProvider.model || 'SET'}
                            // </StyledButton>
                            // }
                            />
                            {/* {
                                context.os === 'win' &&
                                // 安装CUDA加速服务
                                <SettingItem
                                    title={t('app.settings.gpuService')}
                                    type='custom'
                                    value={openIndexImage}
                                    onAction={toggleVisualIndex}
                                    action={<StyledButton
                                        variant='text'
                                        onClick={() => { setGpuSeverOpen(true) }} >
                                        {isInstallGpu ? t('app.settings.reInstall') : t('app.settings.install')}
                                    </StyledButton>
                                    }
                                />
                            } */}
                        </Stack>
                        <Stack spacing={1}>
                            <Typography variant='titleSmall' className='color-rgba(0, 0, 0, 0.85)' >
                                System
                            </Typography>
                            {/* 打开日志 */}
                            <SettingItem
                                title={t('app.settings.logFolder')}
                                action={t('app.settings.open')}
                                onAction={() => window.electronAPI.openDir('runLog')}
                                type='button'
                            />
                            {/* 用户体验计划 */}
                            <SettingItem
                                title={t('app.settings.userExperience')}
                                type='switch'
                                value={reportAgreement}
                                onAction={toggleReportAgreement}
                            />
                            {/* 检查更新 */}
                            <SettingItem
                                title={t('app.settings.checkUpdate')}
                                type='custom'
                                value={updateStatusText}
                                action={
                                    <Stack direction='row' alignItems='center' spacing={2}>
                                        <Typography variant="body2" color={'text.secondary'}>
                                            {updateStatusText || t('app.settings.checkUpdateStatusLatest' as any)}
                                        </Typography>
                                        <StyledButton
                                            disabled={isCheckingUpdate}
                                            variant='text'
                                            onClick={manualCheckUpdate}
                                        >
                                            {t('app.settings.check' as any)}
                                        </StyledButton>
                                    </Stack>
                                }
                            />
                            {/* 自动启动开关 */}
                            <SettingItem
                                title={t('app.settings.autoLaunch')}
                                type='switch'
                                value={autoLaunch}
                                onAction={toggleAutoLaunch}
                            />
                        </Stack>
                        {/* 
                        静默启动开关
                        <SettingItem
                            title={t('app.settings.autoLaunchHidden')}
                            type='switch'
                            value={autoLaunchHidden}
                            onAction={toggleAutoLaunchHidden}
                        /> */}
                        <Stack spacing={1} >
                            <Typography variant='titleSmall' >
                                Language
                            </Typography>
                            <SettingItem
                                title={t('app.settings.language')}
                                type='custom'
                                onAction={() => { }}
                                action={<LanguageSwitcher variant='select' size='small' showLabel={false} />}
                            />
                        </Stack>
                        <Stack spacing={1} >
                            <Typography variant='titleSmall' >
                                Contact
                            </Typography>
                            <Contact />
                        </Stack>
                    </Stack>
                </Paper>
            }
            {
                openAIProvider &&
                <AIProvider onFinish={() => { setOpenAIProvider(false), setOpenSetting(true) }} />
            }
        </Stack>
    </>
}


export default Setting;