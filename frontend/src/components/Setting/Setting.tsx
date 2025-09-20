import { Drawer, Box, Typography, Card, CardContent, Switch, styled, Paper, Stack, Button } from '@mui/material';
import styles from './Setting.module.scss'
import { useEffect, useState } from 'react';
import { Dialog } from '@/components';
import { UserConfig } from '@/type/system';


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
    const [hasGPU, setHasGPU] = useState(false)


    // 拉取用户配置
    useEffect(() => {
        if (open) {
            window.electronAPI.getConfig().then((res: UserConfig) => {
                console.log('config', res)
                setOpenIndexImage(Boolean(res.visual_index_enabled))
                setHasGPU(res.hasGPU) // 需要重新删除数据库尝试
            })
        }
    }, [open])

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

    return (
        <div>
            <Dialog
                title='开启视觉索引服务'
                primaryButtonText='开启'
                onPrimaryButtonClick={() => {
                    setConfirmDialogOpen(false)
                    setOpenIndexImage(true)
                    window.electronAPI.toggleIndexImage(true)
                }}
                secondaryButtonText='取消'
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
                <Box role="presentation">
                    <StyledTitle variant="h5" >
                        设置
                    </StyledTitle>
                    <Stack spacing={1}>
                        <Paper className={styles.settingItem} elevation={0} variant='outlined' >
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant="body1" className={styles.label} >开启图片索引</Typography>
                                <Switch
                                    checked={openIndexImage}
                                    onChange={(e) => { toggleVisualIndex(e.target.checked) }}
                                />
                            </Stack>
                        </Paper>

                        <Paper className={styles.settingItem} elevation={0} variant='outlined' >
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant="body1" className={styles.label} >运行日志</Typography>
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
                                    打开
                                </Button>
                            </Stack>
                        </Paper>
                    </Stack>
                </Box>
            </Drawer>
        </div>
    );
};

export default Setting;