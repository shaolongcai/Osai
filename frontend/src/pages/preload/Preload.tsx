import { Stack, LinearProgress, Typography, Button } from "@mui/material"
import { useRef, useEffect, useCallback } from "react";
import searchNull from '@/assets/images/search-null.png'
import styles from './Preload.module.scss'
import { useNavigate } from 'react-router-dom';


const Preload = () => {

    const effectRan = useRef(false); // 执行守卫
    const navigate = useNavigate();

    // 初始化准备工作
    useEffect(() => {
        if (effectRan.current) {
            return;
        }
        init();
    }, []);

    const init = useCallback(async () => {
        effectRan.current = true;
        const res = await window.electronAPI.init();
        if (res.code === 0) {
            // 跳转到首页
            navigate('/home');
        }
    }, [navigate])


    return (
        <Stack className={styles.root} spacing={1} alignItems="center">
            <img src={searchNull} className={styles.image} />
            <LinearProgress
                className={styles.progress}
            />
            <Typography variant="body1" align="center"
                sx={{
                    fontWeight: 700,
                }}>
                正在准备必要的组件，请稍后
            </Typography>
            <Button variant='outlined' onClick={() => window.electronAPI.openDir('runLog')}>
                打开日志
            </Button>
        </Stack>
    )

}

export default Preload