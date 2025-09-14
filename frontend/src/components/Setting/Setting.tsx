import { Drawer, Box, Typography, Card, CardContent, Switch, styled, Paper, Stack } from '@mui/material';
import styles from './Setting.module.scss'
import { useState } from 'react';

// 步骤1：定义组件的 Props 接口
// 作用：让父组件可以控制侧边栏的打开（open）和关闭（onClose）状态。
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

    // 切换视觉索引开关
    const toggleVisualIndex = (checked: boolean) => {
        setOpenIndexImage(checked)
        localStorage.setItem('openIndexImage', checked ? '1' : '0')
        window.electronAPI.toggleIndexImage(checked)
        // if (checked) {
        //     // 开启视觉索引
        //     window.electronAPI.IndexImage()
        // }
        // else{
        //     // 关闭视觉索引
        //     window.electronAPI.toggleIndexImage(checked)
        // }
    }

    return (
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

                <Paper className={styles.settingItem} elevation={0} variant='outlined' >
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                        <Typography variant="body1" className={styles.label} >开启图片索引</Typography>
                        <Switch
                            checked={openIndexImage}
                            onChange={(e) => { toggleVisualIndex(e.target.checked) }}
                        />
                    </Stack>
                </Paper>
            </Box>
        </Drawer>
    );
};

export default Setting;