import { Dialog, Box, Typography, Paper, Stack, Button, IconButton, styled } from '@mui/material';
import { useEffect, useState } from 'react';
import { Contact, Dialog as CustomDialog, ReportProtocol, SettingItem } from '@/components';
import { ConfigParams } from '@/types/electron';
import { useContext } from 'react';
import { globalContext } from '@/contexts/globalContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/contexts/I18nContext';


const StyledTitle = styled(Typography)(({ theme }) => ({
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00000085',
    marginBottom: theme.spacing(2),
}));

interface SettingProps {
    open: boolean;
    onClose: () => void;
}

// 設置類別類型
type SettingCategory = 'general' | 'ai' | 'update' | 'about';

const Setting: React.FC<SettingProps> = ({ open, onClose }) => {

    const [selectedCategory, setSelectedCategory] = useState<SettingCategory>('general')
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
    const [autoLaunch, setAutoLaunch] = useState(false) //是否開機自啟動
    const [autoLaunchHidden, setAutoLaunchHidden] = useState(false) //是否靜默啟動
    const [updateStatus, setUpdateStatus] = useState<{ isLatest: boolean | null; message?: string; version?: string }>({ isLatest: null }) //更新狀態

    const context = useContext(globalContext)
    const { t } = useTranslation();



    // 拉取用户配置
    useEffect(() => {
        if (open) {
            // 重置更新狀態，允許用戶重新檢查
            setUpdateStatus({ isLatest: null });
            setIsCheckingUpdate(false);

            window.electronAPI.getConfig().then((res: UserConfig) => {
                console.log('config', res)
                setOpenIndexImage(res.visual_index_enabled)
                setHasGPU(res.hasGPU)
                setIsInstallGpu(res.cuda_installed)
                setReportAgreement(res.report_agreement)
                // 讀取自啟動狀態
                window.electronAPI.getAutoLaunch().then((result: { enabled: boolean; openAsHidden: boolean }) => {
                    setAutoLaunch(result.enabled)
                    setAutoLaunchHidden(result.openAsHidden)
                })
            })
        }
    }, [open])

    // 監聽更新狀態並在抽屜開啟時自動檢查（在非 Electron 環境下跳過）
    useEffect(() => {
        if (!open) {
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
        onClose()
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

    return (
        <div style={{ padding: 4 }}>
            {/* 同意协议弹窗 */}
            <ReportProtocol
                open={openReportProtocol}
                onClose={() => setOpenReportProtocol(false)}
                onConfirm={() => { setReportAgreement(true) }} // 同意协议的回调
            />
            {/* 开启GPU服务 */}
            <CustomDialog
                title={hasGPU ? t('app.settings.gpuService') : '本机没有任何GPU'}
                primaryButtonText={hasGPU ? t('app.common.confirm') : t('app.common.close')}
                onPrimaryButtonClick={() => {
                    if (hasGPU) {
                        installGpu()
                    } else {
                        setGpuSeverOpen(false)
                    }
                }}
                secondaryButtonText={hasGPU ? t('app.common.cancel') : undefined}
                open={gpuSeverOpen}
                onClose={() => { setGpuSeverOpen(false) }}
                maxWidth='xs'
                fullWidth={false}
            >
                {
                    hasGPU ? (
                        <Typography className="text-sm text-text-primary" >
                            即将安装 GPU 加速服务，可能需要几分钟，请耐心等候。安装完毕后，请重启应用。
                        </Typography>
                    ) : (
                        <Typography className="text-sm text-text-primary">
                            本机没有GPU/显卡，无法安装 GPU 加速服务。应用将会启动 CPU 索引图片。
                        </Typography>
                    )
                }
            </CustomDialog>
            {/* 视觉服务提示 */}
            <CustomDialog
                title={t('app.settings.visualIndex')}
                primaryButtonText={t('app.common.confirm')}
                onPrimaryButtonClick={() => {
                    setConfirmDialogOpen(false)
                    setOpenIndexImage(true)
                    window.electronAPI.toggleIndexImage(true)
                }}
                secondaryButtonText={t('app.common.cancel')}
                open={confirmDialogOpen}
                onClose={() => { setConfirmDialogOpen(false) }}
                fullWidth={false}
            >
                <Typography className="text-sm text-text-primary">
                    📌 CPU下，AI视觉索引的耗时会较长。
                </Typography>
                <Typography className="text-sm text-text-primary">
                    📌 已索引的图片能立即提供AI搜索。
                </Typography>
                <Typography className="text-sm text-text-primary">
                    📌 索引操作会在后台进行，你可以随时在设置中关闭视觉索引。
                </Typography>
            </CustomDialog>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth={false}
                fullWidth
                PaperProps={{
                    sx: {
                        width: '90%',
                        maxWidth: '900px',
                        height: '80%',
                        maxHeight: '700px',
                        borderRadius: '8px',
                        backgroundColor: '#FAFDFC',
                        padding: 4,
                        boxSizing: 'border-box'
                    }
                }}
            >
                <Box
                    role="presentation"
                    sx={{
                        flex: 1
                    }}>
                    <StyledTitle variant="h5" >
                        {t('app.settings.title')}
                    </StyledTitle>
                    <Stack spacing={1}>
                        <SettingItem
                            title={t('app.settings.visualIndex')}
                            type='switch'
                            value={openIndexImage}
                            onAction={toggleVisualIndex}
                        />
                        {
                            context.os === 'win' &&
                            <SettingItem
                                title={t('app.settings.gpuService')}
                                type='custom'
                                value={openIndexImage}
                                onAction={toggleVisualIndex}
                                action={<Button
                                    sx={{
                                        '&:focus': {
                                            outline: 'none',
                                            border: 'none',
                                            boxShadow: 'none'
                                        },
                                        '&:active': {
                                            outline: 'none',
                                            border: 'none',
                                            boxShadow: 'none'
                                        },
                                        '&:hover': {
                                            border: 'none'
                                        }
                                    }}
                                    variant='text'
                                    onClick={() => { setGpuSeverOpen(true) }} >
                                    {isInstallGpu ? t('app.settings.reInstall') : t('app.settings.install')}
                                </Button>
                                }
                            />
                        }
                        <Paper className="p-4 rounded-xl border border-border" elevation={0} variant='outlined' >
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant="body1" className="text-sm font-semibold text-text-secondary" >{t('app.settings.logFolder')}</Typography>
                                <Button
                                    sx={{
                                        '&:focus': {
                                            outline: 'none',
                                            border: 'none',
                                            boxShadow: 'none'
                                        },
                                        '&:active': {
                                            outline: 'none',
                                            border: 'none',
                                            boxShadow: 'none'
                                        },
                                        '&:hover': {
                                            border: 'none'
                                        }
                                    }}
                                    variant='text'
                                    onClick={() => {
                                        window.electronAPI.openDir('runLog')
                                    }}>
                                    {t('app.settings.open')}
                                </Button>
                            </Stack>
                        </Paper>
                        <Paper className="p-4 rounded-xl border border-border" elevation={0} variant='outlined' >
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant="body1" className="text-sm font-semibold text-text-secondary" >{t('app.settings.language')}</Typography>
                                <LanguageSwitcher variant='select' size='small' showLabel={false} />
                            </Stack>
                        </Paper>
                        <SettingItem
                            title={t('app.settings.userExperience')}
                            type='switch'
                            value={reportAgreement}
                            onAction={toggleReportAgreement}
                        />
                        {/* 檢查更新 */}
                        <Paper className="p-4 rounded-xl border border-border" elevation={0} variant='outlined' >
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant="body1" className="text-sm font-semibold text-text-secondary" >{t('app.settings.checkUpdate' as any)}</Typography>
                                <Stack direction='row' alignItems='center' spacing={2}>
                                    <Typography variant="body2" color={'text.secondary'}>
                                        {updateStatusText || t('app.settings.checkUpdateStatusLatest' as any)}
                                    </Typography>
                                    <Button
                                        sx={{
                                            '&:focus': { outline: 'none', border: 'none', boxShadow: 'none' },
                                            '&:active': { outline: 'none', border: 'none', boxShadow: 'none' },
                                            '&:hover': { border: 'none' }
                                        }}
                                        disabled={isCheckingUpdate}
                                        variant='text'
                                        onClick={manualCheckUpdate}
                                    >
                                        {t('app.settings.check' as any)}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                        {/* 自动启动开关 */}
                        <SettingItem
                            title={t('app.settings.autoLaunch')}
                            type='switch'
                            value={autoLaunch}
                            onAction={toggleAutoLaunch}
                        />
                        {/* 静默启动开关 */}
                        <SettingItem
                            title={t('app.settings.autoLaunchHidden')}
                            type='switch'
                            value={autoLaunchHidden}
                            onAction={toggleAutoLaunchHidden}
                            disabled={!autoLaunch}
                        />
                    </Stack>
                </Box>
            </Dialog>
        </div>
    );
};

export default Setting;