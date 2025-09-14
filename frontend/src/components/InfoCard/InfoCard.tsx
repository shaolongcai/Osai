import { Card, CardContent, Stack, Tooltip, Typography, CircularProgress, Collapse, Fade } from "@mui/material";
import {
    Error as WaringIcon,
    AccessTimeFilled as PendingIcon,
    CheckCircle as SuccessIcon,
    Help as LoadingQuestionIcon,
    KeyboardArrowDown as DownIcon,
    Help as QuestionIcon
} from '@mui/icons-material';

import styles from './InfoCard.module.scss'
import { NOTIFICATION_TYPE, NotificationType } from "@/utils/enum";
import { Notification } from "@/type/electron";
import { useEffect, useRef, useState } from "react";


interface Props {

}
const InfoCard: React.FC<Props> = ({

}) => {

    const [isCollapsed, setIsCollapsed] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const effectRan = useRef(false); // 执行守卫

    useEffect(() => {
        const indexCheckGPUAndDownloadModel = async () => {
            // 执行守卫，防止在开发模式下触发两次
            if (effectRan.current === true) {
                return;
            }
            // 告知主线程，前端渲染完毕
            const gpuInfo = await window.electronAPI.rendererReady()
            console.log('gpuInfo', gpuInfo)
            if (gpuInfo.hasGPU) {
                // 若拥有GPU则自动打开图片索引
                await window.electronAPI.IndexImage()
            }
        }
        indexCheckGPUAndDownloadModel();
        return () => {
            effectRan.current = true;
        }
    }, [])

    // 接收后台的消息推送
    useEffect(() => {
        window.electronAPI.onSystemInfo((data) => {
            console.log('收到消息:', data);
            setNotifications(prev => {
                const index = prev.findIndex(item => item.id === data.id)
                // 如果找到相同id的通知，则更新该通知
                if (index !== -1) {
                    const newNotifications = [...prev];
                    newNotifications.splice(index, 1); // 先删除原来的消息
                    newNotifications.unshift(data); // 将更新的消息放到数组最前面
                    return newNotifications;
                }
                // 如果没找到，则添加到数组最前面
                return [data, ...prev];
            })
        })
        return () => {
            window.electronAPI.removeAllListeners('system-info')
        }
    }, [])

    //渲染图标
    const renderIcon = (type: NotificationType) => {
        switch (type) {
            case NOTIFICATION_TYPE.PENDING:
                return <PendingIcon className={styles.icon} color='warning' />
            case NOTIFICATION_TYPE.SUCCESS:
                return <SuccessIcon className={styles.icon} color='success' />
            case NOTIFICATION_TYPE.WARNING:
                return <WaringIcon className={styles.icon} color='error' />
            case NOTIFICATION_TYPE.LOADING:
                return <CircularProgress className={styles.icon} size={24} />
            case NOTIFICATION_TYPE.LOADING_QUESTION:
                return <LoadingQuestionIcon className={styles.icon} color='info' />
            case NOTIFICATION_TYPE.QUESTION:
                return <QuestionIcon className={styles.icon} color='info' />
            default:
                return null
        }
    }

    return (
        <Card className={styles.root}>
            <DownIcon className={styles.downIcon} fontSize='medium'
                onClick={() => setIsCollapsed(!isCollapsed)}
                sx={{
                    //    当 isCollapsed 为 true 时，旋转180度
                    transform: !isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease-in-out'
                }}
            />
            <CardContent sx={{ p: 3 }}>
                <Collapse in={isCollapsed} collapsedSize={24}>
                    <Stack spacing={1}>
                        {notifications.map(item =>
                            <Stack
                                key={item.text}
                                direction='row'
                                className={styles.info}
                                alignItems='center'
                                justifyContent='space-between'
                            >
                                <Typography variant="body2" component="div" className={styles.text}>
                                    {item.text}
                                </Typography>
                                <Tooltip title={item.tooltip} arrow className={styles.tooltip} >
                                    <div style={{ height: '24px' }}>
                                        {/* 没有转发ref，Tooltip 内部的元素不会被转发 */}
                                        {renderIcon(item.type)}
                                    </div>
                                </Tooltip>
                            </Stack>
                        )}
                    </Stack>
                </Collapse>
            </CardContent>
        </Card>
    )
}


export default InfoCard;