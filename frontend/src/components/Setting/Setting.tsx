import { Drawer, Box, Typography, styled, Paper, Stack, Button } from '@mui/material';
import styles from './Setting.module.scss'
import { useEffect, useState } from 'react';
import { Contact, Dialog, ReportProtocol, SettingItem } from '@/components';
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

// 步骤2：创建一个带样式的标题组件
// 作用：将标题样式（字号、粗细、颜色）封装起来，使代码更清晰。
const StyledTitle = styled(Typography)(({ theme }) => ({
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00000085',
    marginBottom: theme.spacing(2),
}));

const Setting: React.FC<SettingProps> = ({ open, onClose }) => {

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
            <Dialog
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
            </Dialog>
            <Drawer
                anchor="right" // 从右侧滑出
                open={open}
                onClose={onClose}
                sx={{
                    '& .MuiDrawer-paper': {
                        backgroundColor: '#FAFDFC',
                        width: 360, // 设置一个合适的宽度
                        padding: '16px', // 增加内边距
                        boxSizing: 'border-box',
                    },
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
                                    {isInstallGpu ? '重新安装' : '安装'}
                                </Button>
                                }
                            />
                        }
                        <Paper className={styles.settingItem} elevation={0} variant='outlined' >
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant="body1" className={styles.label} >{t('app.settings.logFolder')}</Typography>
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
                        <Paper className={styles.settingItem} elevation={0} variant='outlined' >
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant="body1" className={styles.label} >{t('app.settings.language')}</Typography>
                                <LanguageSwitcher variant='select' size='small' showLabel={false} />
                            </Stack>
                        </Paper>
                        <Paper className={styles.settingItem} elevation={0} variant='outlined' >
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant="body1" className={styles.label} >{t('app.settings.checkUpdate')}</Typography>
                                {updateStatus.isLatest !== null ? (
                                    // 檢查完成後，顯示狀態文字替換按鈕
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
                                    // 未檢查或檢查中，顯示按鈕
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
                        <SettingItem
                            title={t('app.settings.userExperience')}
                            type='switch'
                            value={reportAgreement}
                            onAction={toggleReportAgreement}
                        />
                    </Stack>
                </Box>
                <div className={styles.contact}>
                    <Contact title={t('app.settings.community')} />
                </div>
            </Drawer>
        </div>
    );
};

export default Setting;