import { Stack, LinearProgress, Typography, Button } from "@mui/material"
import { useRef, useEffect, useCallback, useState } from "react";
import searchNull from '@/assets/images/search-null.png'
import styles from './Preload.module.scss'
import { useNavigate } from 'react-router-dom';
import { ReportProtocol } from "@/components";


const Preload = () => {

    const [initError, setInitError] = useState<string | null>(null);
    const [protocolOpen, setProtocolOpen] = useState(!Boolean(localStorage.getItem('not_remind_again'))); // 协议弹窗

    const effectRan = useRef(false); // 执行守卫
    const navigate = useNavigate();

    // 获取用户配置，是否已经同意协议
    useEffect(() => {
        // 若已同意协议，则不需要再显示弹窗
        if (localStorage.getItem('not_remind_again') === 'true') {
            setProtocolOpen(false);
            return;
        }

        // 已设置同意不需要再询问
        window.electronAPI.getConfig('report_agreement').then((value) => {
            if (value) {
                setProtocolOpen(false);
                localStorage.setItem('not_remind_again', 'true');
            }
        });
    }, []);

    // 初始化准备工作
    useEffect(() => {
        // 协议弹窗关闭时，才初始化
        if (protocolOpen) {
            return;
        }
        if (effectRan.current) {
            return;
        }
        init();
    }, [protocolOpen]);

    const init = useCallback(async () => {
        effectRan.current = true;
        const res = await window.electronAPI.init();
        if (res.code === 0) {
            // 跳转到首页
            navigate('/home');
        }
        else {
            setInitError(res.errMsg);
        }
    }, [navigate])


    return (
        <>
            {/* 弹窗同意条款 */}
            <ReportProtocol
                open={protocolOpen}
                onClose={() => setProtocolOpen(false)}
            />
            <Stack className={styles.root} spacing={1} alignItems="center">
                {
                    initError ? (
                        <Stack spacing={1} alignItems="center">
                            <img src={searchNull} className={styles.image} />
                            <Typography variant="body1" color="error" align="center">
                                初始化失败
                            </Typography>
                            <Typography variant="body1" color="error" align="center">
                                {initError}
                            </Typography>
                            <Button variant='outlined' onClick={() => window.electronAPI.openDir('runLog')}>
                                打开日志
                            </Button>
                        </Stack>
                    ) :
                        <>
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
                        </>
                }
            </Stack>
        </>
    )

}

export default Preload