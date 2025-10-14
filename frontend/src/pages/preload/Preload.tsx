import { Stack, LinearProgress, Typography, Button } from "@mui/material"
import { useRef, useEffect, useCallback, useState } from "react";
import initImg from '@/assets/images/init.png'
import initErrorImg from '@/assets/images/init-error.png'
import styles from './Preload.module.scss'
import { useNavigate } from 'react-router-dom';
import { Dialog, ReportProtocol } from "@/components";


const Preload = () => {

    const [initError, setInitError] = useState<string | null>(null);
    const [protocolOpen, setProtocolOpen] = useState(!Boolean(localStorage.getItem('not_remind_again') === 'true')); // 协议弹窗
    const [updateOpen, setUpdateOpen] = useState(false); // 更新弹窗

    const effectRan = useRef(false); // 执行守卫
    const navigate = useNavigate();

    // 检查是否有更新， 考虑用wait - promise 去处理三个事情： 1、检查更新版本，2、同意协议，3、初始化服务
    useEffect(() => {
        checkForUpdates();
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


    // 获取更新信息
    const checkForUpdates = useCallback(async () => {
        const res = await window.electronAPI.checkForUpdates();
        if (res) {
            console.log('有更新')
            setUpdateOpen(true);
        }
    }, []);

    // 展示同意协议
    const showAgreeProtocol = useCallback(() => {
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

    // 处理更新
    const handleUpdate = useCallback(() => {
        console.log('处理更新')
        return
        window.electronAPI.update();
        showAgreeProtocol();
    }, []);

    //关闭更新弹窗
    const handleCloseUpdate = useCallback(() => {
        setUpdateOpen(false);
        showAgreeProtocol();
    }, [showAgreeProtocol]);

    return (
        <>
            {/* 新版本更新 */}
            <Dialog
                title="更新版本"
                open={updateOpen}
                onClose={handleCloseUpdate}
                onSecondaryButtonClick={handleCloseUpdate}
                onPrimaryButtonClick={handleUpdate}
            >
                <Typography variant="h6" align="center">
                    发现最新版本，是否进行更新
                </Typography>
            </Dialog>
            {/* 弹窗同意条款 */}
            <ReportProtocol
                open={protocolOpen}
                onClose={() => setProtocolOpen(false)}
            />
            <Stack className={styles.root} spacing={1} alignItems="center">
                {
                    initError ? (
                        <Stack spacing={1} alignItems="center">
                            <img src={initErrorImg} className={styles.image} />
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
                            <img src={initImg} className={styles.image} />
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