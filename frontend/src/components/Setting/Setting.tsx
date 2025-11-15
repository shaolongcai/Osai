import { Dialog, Box, Typography, Paper, Stack, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from './Setting.module.scss'
import { useEffect, useState } from 'react';
import { Contact, Dialog as CustomDialog, ReportProtocol, SettingItem } from '@/components';
import { UserConfig } from '@/types/system';
import { ConfigParams } from '@/types/electron';
import { useContext } from 'react';
import { globalContext } from '@/contexts/globalContext';
import { useTranslation } from '@/contexts/I18nContext';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';

// 更新狀態類型
interface UpdateStatusData {
    isUpdateAvailable?: boolean;
    version?: string;
    message?: string;
}

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
    const [autoLaunch, setAutoLaunch] = useState(false) //是否開機自啟動
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false) //是否正在檢查更新
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
                window.electronAPI.getAutoLaunch().then((enabled: boolean) => {
                    setAutoLaunch(enabled)
                })
            })
        }
    }, [open])

    // 監聽更新狀態
    useEffect(() => {
        if (!open) return;

        const handleUpdateStatus = (data: UpdateStatusData) => {
            console.log('更新狀態:', data);
            if (data.isUpdateAvailable) {
                // 有新版本
                setUpdateStatus({
                    isLatest: false,
                    version: data.version,
                    message: data.message || t('app.settings.checkUpdateStatusNewVersion', { version: data.version })
                });
            } else {
                // 已是最新版本或檢查完成
                setUpdateStatus({
                    isLatest: true,
                    message: data.message || t('app.settings.checkUpdateStatusLatest')
                });
            }
            setIsCheckingUpdate(false);
        };

        window.electronAPI.onUpdateStatus(handleUpdateStatus);

        return () => {
            window.electronAPI.removeAllListeners('update-status');
        };
    }, [open, t])

    // 安装GPU服务
    const installGpu = async () => {
        console.log('即将安装GPU服务')
        setGpuSeverOpen(false)
        onClose()
        window.electronAPI.installGpuServer()
        // setIsInstallGpu(true)
    }

    // 手動檢查更新
    const handleCheckUpdate = async () => {
        if (!window.electronAPI) return;
        setIsCheckingUpdate(true);
        // 重置更新狀態，準備顯示新的檢查結果
        setUpdateStatus({ isLatest: null });
        try {
            await window.electronAPI.checkForUpdates();
        } catch (error) {
            console.error('檢查更新失敗:', error);
            setIsCheckingUpdate(false);
        }
        // 注意：isCheckingUpdate 會在 onUpdateStatus 回調中設置為 false
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
        await window.electronAPI.setAutoLaunch(checked)
    }

    return (
        <div>
            {/* 同意协议弹窗 */}
            <ReportProtocol
                open={openReportProtocol}
                onClose={() => setOpenReportProtocol(false)}
                onConfirm={() => { setReportAgreement(true) }} // 同意协议的回调
            />
            {/* 开启GPU服务 */}
            <Dialog
                title={hasGPU ? t('app.settings.gpuService') : '本机没有任何GPU'}
                primaryButtonText={hasGPU ? t('app.common.confirm') : t('app.common.close')}
                onPrimaryButtonClick={() => {
                    if (hasGPU) {
                        installGpu()
                    } else {
                        setGpuSeverOpen(false)
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
                        <Typography className={styles.dialogTips} >
                            即将安装 GPU 加速服务，可能需要几分钟，请耐心等候。安装完毕后，请重启应用。
                        </Typography>
                    ) : (
                        <Typography className={styles.dialogTips}>
                            本机没有GPU/显卡，无法安装 GPU 加速服务。应用将会启动 CPU 索引图片。
                        </Typography>
                    )
                }
            </Dialog>
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
                <Typography className={styles.dialogTips}>
                    📌 CPU下，AI视觉索引的耗时会较长。
                </Typography>
                <Typography className={styles.dialogTips}>
                    📌 已索引的图片能立即提供AI搜索。
                </Typography>
                <Typography className={styles.dialogTips}>
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
                    }
                }}
            >
                <Box className={styles.settingContainer}>
                    {/* 標題欄 */}
                    <Box className={styles.header}>
                        <Typography variant="h5" className={styles.headerTitle}>
                            {t('app.settings.title')}
                        </Typography>
                        <IconButton
                            onClick={onClose}
                            size="small"
                            sx={{
                                color: '#00000085',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* 主內容區域 */}
                    <Box className={styles.content}>
                        {/* 左側導航側邊欄 */}
                        <Box className={styles.sidebar}>
                            <Button
                                className={`${styles.navItem} ${selectedCategory === 'general' ? styles.navItemActive : ''}`}
                                onClick={() => setSelectedCategory('general')}
                                fullWidth
                            >
                                {t('app.settings.generalSettings')}
                            </Button>
                            <Button
                                className={`${styles.navItem} ${selectedCategory === 'ai' ? styles.navItemActive : ''}`}
                                onClick={() => setSelectedCategory('ai')}
                                fullWidth
                            >
                                {t('app.settings.aiSettings')}
                            </Button>
                            <Button
                                className={`${styles.navItem} ${selectedCategory === 'update' ? styles.navItemActive : ''}`}
                                onClick={() => setSelectedCategory('update')}
                                fullWidth
                            >
                                {t('app.settings.update')}
                            </Button>
                            <Button
                                className={`${styles.navItem} ${selectedCategory === 'about' ? styles.navItemActive : ''}`}
                                onClick={() => setSelectedCategory('about')}
                                fullWidth
                            >
                                {t('app.settings.about')}
                            </Button>
                        </Box>

                        {/* 右側內容區域 */}
                        <Box className={styles.mainContent}>
                            {selectedCategory === 'general' && (
                                <Stack spacing={2}>
                                    <Paper className={styles.settingItem} elevation={0} variant='outlined'>
                                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                            <Typography variant="body1" className={styles.label}>
                                                {t('app.settings.language')}
                                            </Typography>
                                            <LanguageSwitcher variant='select' size='small' showLabel={false} />
                                        </Stack>
                                    </Paper>
                                    <Paper className={styles.settingItem} elevation={0} variant='outlined'>
                                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                            <Typography variant="body1" className={styles.label}>
                                                {t('app.settings.logFolder')}
                                            </Typography>
                                            <Button
                                                sx={{
                                                    color: '#1976d2',
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
                                                        backgroundColor: 'transparent',
                                                        textDecoration: 'underline'
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
                                </Stack>
                            )}

                            {selectedCategory === 'ai' && (
                                <Stack spacing={2}>
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
                                                    color: '#1976d2',
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
                                                        backgroundColor: 'transparent',
                                                        textDecoration: 'underline'
                                                    }
                                                }}
                                                variant='text'
                                                onClick={() => { setGpuSeverOpen(true) }} >
                                                {isInstallGpu ? t('app.settings.reInstall') : t('app.settings.install')}
                                            </Button>
                                            }
                                        />
                                    }
                                </Stack>
                            )}

                            {selectedCategory === 'update' && (
                                <Stack spacing={2}>
                                    <Paper className={styles.settingItem} elevation={0} variant='outlined'>
                                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                            <Typography variant="body1" className={styles.label}>
                                                {t('app.settings.checkUpdate')}
                                            </Typography>
                                            {updateStatus.isLatest !== null ? (
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        color: updateStatus.isLatest ? 'success.main' : 'warning.main',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {updateStatus.message}
                                                </Typography>
                                            ) : (
                                                <Button
                                                    sx={{
                                                        color: '#1976d2',
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
                                                            backgroundColor: 'transparent',
                                                            textDecoration: 'underline'
                                                        }
                                                    }}
                                                    variant='text'
                                                    onClick={handleCheckUpdate}
                                                    disabled={isCheckingUpdate}
                                                >
                                                    {isCheckingUpdate ? t('app.settings.checking') : t('app.settings.check')}
                                                </Button>
                                            )}
                                        </Stack>
                                    </Paper>
                                    <SettingItem
                                        title={t('app.settings.autoLaunch')}
                                        type='switch'
                                        value={autoLaunch}
                                        onAction={toggleAutoLaunch}
                                    />
                                </Stack>
                            )}

                            {selectedCategory === 'about' && (
                                <Stack spacing={2}>
                                    <Paper className={styles.settingItem} elevation={0} variant='outlined'>
                                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                            <Typography variant="body1" className={styles.label}>
                                                {t('app.settings.website')}
                                            </Typography>
                                            <Button
                                                sx={{
                                                    color: '#1976d2',
                                                    textTransform: 'none',
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
                                                        backgroundColor: 'transparent',
                                                        textDecoration: 'underline'
                                                    }
                                                }}
                                                variant='text'
                                                onClick={() => {
                                                    window.electronAPI.openExternalUrl('https://osai.click')
                                                }}>
                                                https://osai.click
                                            </Button>
                                        </Stack>
                                    </Paper>
                                    <SettingItem
                                        title={t('app.settings.userExperience')}
                                        type='switch'
                                        value={reportAgreement}
                                        onAction={toggleReportAgreement}
                                    />
                                    <Box className={styles.contact}>
                                        <Contact title={t('app.settings.community')} />
                                    </Box>
                                </Stack>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </div>
    );
};

export default Setting;