import { Button, Paper, Stack, Typography, Drawer, Box, Switch, styled } from "@mui/material"
import { useState, useEffect, useContext } from "react";
import {
    Settings as SettingsIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import RootProviders from "@/RootProviders";
import { useGlobalContext, globalContext } from "@/contexts/globalContext";
import { SettingItem, Contact, Dialog, ReportProtocol } from "@/components";
import { useTranslation } from '@/contexts/I18nContext';
import { UserConfig } from '@/types/system';
import { ConfigParams } from '@/types/electron';
import LanguageSwitcher from '@/components/LanguageSwitcher';


// 作用：将标题样式（字号、粗细、颜色）封装起来，使代码更清晰。
const StyledTitle = styled(Typography)(({ theme }) => ({
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00000085',
    marginBottom: theme.spacing(2),
}));

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
    return <Paper
        className='rounded-b-lg '
        elevation={3}
        onClick={() => {
            setOpenSetting(!openSetting);
        }}
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            height: '40px',
            width: '40px',
        }}
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
    </Paper>
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
    const [reportAgreement, setReportAgreement] = useState(false) //是否已同意用户体验改进计划
    // 更新檢查相關狀態
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
    const [latestVersion, setLatestVersion] = useState<string | null>(null)
    const [updateStatusText, setUpdateStatusText] = useState('')

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
            })
        }
    }, [openSetting])

    // 監聽更新狀態並在抽屜開啟時自動檢查（在非 Electron 環境下跳過）
    useEffect(() => {
        if (!openSetting) {
            window.electronAPI.removeAllListeners('update-status')
            return
        }
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
            setIsCheckingUpdate(false)
            if (data && data.isUpdateAvailable) {
                setIsUpdateAvailable(true)
                setLatestVersion(String(data.version || ''))
                setUpdateStatusText(t('app.settings.checkUpdateStatusNewVersion' as any, { version: data.version || '' }))
            } else {
                setIsUpdateAvailable(false)
                setLatestVersion(null)
                const msg = data?.message || t('app.settings.checkUpdateStatusLatest' as any)
                setUpdateStatusText(msg)
            }
        })
        return () => {
            window.electronAPI.removeAllListeners('update-status')
        }
    }, [open, t])

    const manualCheckUpdate = async () => {
        if (!(window as any).electronAPI) {
            // 非 Electron 環境：模擬檢查完成
            setIsCheckingUpdate(false)
            setUpdateStatusText(t('app.settings.checkUpdateStatusLatest' as any))
            return
        }
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

    // 切换视觉索引开关
    const toggleVisualIndex = async (checked: boolean) => {
        console.log('hasGPU', hasGPU)
        if (!hasGPU && checked) {
            // CPU下开启需要弹窗
            setConfirmDialogOpen(true)
            return
        }
        // 除此之外直接开启或关闭
        setOpenIndexImage(checked)
        window.electronAPI.toggleIndexImage(checked)
    }

    // 切换用户体验改进计划
    const toggleReportAgreement = async (checked: boolean) => {
        if (checked) {
            // 同意用户体验改进计划，需要弹窗
            setOpenReportProtocol(true)
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

    return <>
        {/* 同意协议弹窗 */}
        <ReportProtocol
            hideBackdrop={true}
            open={openReportProtocol}
            onClose={() => setOpenReportProtocol(false)}
            onConfirm={() => { setReportAgreement(true) }} // 同意协议的回调
        />
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
            sx={{
                marginTop: '16px',
                boxSizing: 'border-box',
            }}
            alignItems='flex-end' spacing={3}
        >
            {/* 设置按钮 */}
            <SettingButton
                openSetting={openSetting}
                setOpenSetting={setOpenSetting}
            />
            {
                openSetting &&
                <Paper
                    sx={{
                       
                        width: '480px',
                        height: '580px',
                        padding: '16px',
                        boxSizing: 'border-box',
                    }}>
                    <Typography variant='headlineSmall' >
                        设置
                    </Typography>
                    <Stack spacing={1} sx={{ marginTop: '16px' }}>
                        <Typography variant='titleMedium' >
                            系统设置
                        </Typography>
                        {
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
                        }
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
                            onAction={() => { setIsCheckingUpdate(true) }}
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
                    </Stack>
                    <Stack spacing={1} sx={{ marginTop: '16px' }}>
                        <Typography variant='titleMedium' >
                            语言设置
                        </Typography>
                        <SettingItem
                            title={t('app.settings.language')}
                            type='custom'
                            // value={currentLanguage}
                            // onAction={setCurrentLanguage}
                            onAction={() => { }}
                            action={<LanguageSwitcher variant='select' size='small' showLabel={false} />}
                        />

                    </Stack>
                </Paper>
            }
        </Stack>
    </>
}


export default Setting;