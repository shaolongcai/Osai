import { Button, Paper, Stack, Typography, styled } from "@mui/material"
import { useState, useEffect, useCallback } from "react";
import { SettingItem, Contact, Dialog, ReportProtocol, AIProvider } from "@/components";
import { useTranslation } from '@/i18n';
import { ConfigParams } from '@/types/electron';
import LanguageSwitcher from '@/components/LanguageSwitcher';


// 封装按钮样式
const StyledButton = styled(Button)(() => ({
    '&:focus': { outline: 'none', border: 'none', boxShadow: 'none' },
    '&:active': { outline: 'none', border: 'none', boxShadow: 'none' },
    '&:hover': { border: 'none' }
}));



/**
 * 设置面板(主界面)
 */
const Setting = () => {

    const [openSetting, setOpenSetting] = useState(true);
    const [openReportProtocol, setOpenReportProtocol] = useState(false) //用户体验改进计划弹窗
    const [hasGPU, setHasGPU] = useState(false)
    const [gpuSeverOpen, setGpuSeverOpen] = useState(false) //GPU服务弹窗
    const [openAIProvider, setOpenAIProvider] = useState(false) //AI服务弹窗
    const [reportAgreement, setReportAgreement] = useState(false) //是否已同意用户体验改进计划
    const [aiProvider, setAiProvider] = useState<{ host: string, model: string }>() //是否已设置AI服务
    // 更新檢查相關狀態
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
    const [updateStatusText, setUpdateStatusText] = useState('')
    const [autoLaunch, setAutoLaunch] = useState(false) //是否開機自啟動
    const [autoLaunchHidden, setAutoLaunchHidden] = useState(false) //是否靜默啟動

    const { t, isLoading } = useTranslation()

    // 拉取用户配置
    const manualCheckUpdate = useCallback(async () => {
        setIsCheckingUpdate(true)
        setUpdateStatusText(t('app.settings.checking'))
        await window.electronAPI.checkForUpdates()
    }, [t]) // t 函數應該是穩定的，但如果還是有問題，可以考慮移除依賴

    useEffect(() => {
        if (isLoading) return
        // 改为直接获取
        window.electronAPI.getConfig().then((res: UserConfig) => {
            console.log('config', res)
            setHasGPU(res.hasGPU)
            setReportAgreement(res.report_agreement)
            setAiProvider(JSON.parse(res.ai_provider || '{}'))
        })
        // 獲取自啟動狀態
        window.electronAPI.getAutoLaunch().then((result: { enabled: boolean; openAsHidden: boolean }) => {
            setAutoLaunch(result.enabled)
            setAutoLaunchHidden(result.openAsHidden)
        })
        // 手动检查一次
        manualCheckUpdate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]) // manualCheckUpdate 應該只在 isLoading 改變時執行一次

    // 監聽更新狀態並在抽屜開啟時自動檢查（在非 Electron 環境下跳過）
    useEffect(() => {
        if (isLoading) return
        if (!window.electronAPI) {
            // 非 Electron 預覽環境：直接顯示最新版本提示
            setIsCheckingUpdate(false)
            setIsUpdateAvailable(false)
            setLatestVersion(null)
            setUpdateStatusText(t('app.settings.checkUpdateStatusLatest'))
            return
        }
        // 僅訂閱事件，不在此自動觸發檢查
        window.electronAPI.onUpdateStatus((data) => {
            console.log('update-status', data)
            setIsCheckingUpdate(false)
            if (data && data.isUpdateAvailable) {
                setUpdateStatusText(t('app.settings.checkUpdateStatusNewVersion', { version: data.version || '' }))
            } else {
                // 根据 data.type 映射到对应的多语言 key，确保有默认值兜底
                let msg: string
                switch (data.type) {
                    case 'not-available-update':
                        msg = t('app.settings.not-available-update')
                        break
                    default:
                        msg = t('app.settings.checkUpdateStatusLatest') // 兜底用"已是最新版"
                }
                setUpdateStatusText(msg)
            }
        })
        return () => {
            window.electronAPI.removeAllListeners('update-status')
        }
    }, [t, isLoading])

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
        }
        setReportAgreement(checked)
        const params: ConfigParams = {
            key: 'report_agreement',
            value: checked,
            type: 'boolean',
        }
        window.electronAPI.setConfig(params)
    }

    // 切換自啟動開關
    const toggleAutoLaunch = async (checked: boolean) => {
        setAutoLaunch(checked)
        await window.electronAPI.setAutoLaunch(checked, autoLaunchHidden)
    }

    return <>
        {/* 开启GPU服务 */}
        <Dialog
            title={hasGPU ? t('app.settings.gpuService') : '本机没有任何GPU'}
            primaryButtonText={hasGPU ? t('app.common.confirm') : t('app.common.close')}
            onPrimaryButtonClick={() => {
                if (hasGPU) {
                    installGpu();
                } else {
                    setGpuSeverOpen(false);
                }
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
        >
            {/* 设置按钮 */}
            {/* <SettingButton
                openSetting={openSetting}
                setOpenSetting={() => { setOpenSetting(!openSetting), setOpenAIProvider(false), setOpenReportProtocol(false) }}
            /> */}
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
                // 设置弹窗
                openSetting &&
                <Paper
                    className="w-[480px] max-h-[680px]! box-border! overflow-y-auto 
                    scrollbar-thin
                    p-6
                    border border-solid border-[rgba(0,0,0,0.12)]
                    "
                >
                    <Typography variant='headlineSmall' >
                        {t('app.settings.title')}
                    </Typography>
                    <Stack spacing={2} sx={{ marginTop: '16px' }}>
                        <Stack spacing={1}>
                            <Typography variant='titleSmall' className='color-rgba(0, 0, 0, 0.85)' >
                                {t('app.settings.aiSettings')}
                            </Typography>
                            <SettingItem
                                title={t('app.settings.aiProvider')}
                                type='button'
                                value={aiProvider?.model || t('app.settings.set')}
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
                                {t('app.settings.system')}
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
                                            {updateStatusText || t('app.settings.checkUpdateStatusLatest')}
                                        </Typography>
                                        <StyledButton
                                            disabled={isCheckingUpdate}
                                            variant='text'
                                            onClick={manualCheckUpdate}
                                        >
                                            {t('app.settings.check')}
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
                                {t('app.settings.language')}
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
                                {t('app.settings.contact')}
                            </Typography>
                            <Contact />
                        </Stack>
                    </Stack>
                </Paper>
            }
            {
                openAIProvider &&
                <AIProvider onFinish={() => { 
                    setOpenAIProvider(false);
                    setOpenSetting(true);
                }} />
            }
        </Stack>
    </>
}


export default Setting;