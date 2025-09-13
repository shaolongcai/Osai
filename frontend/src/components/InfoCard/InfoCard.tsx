import { Card, CardContent, Stack, Tooltip, Typography, CircularProgress, Collapse } from "@mui/material";
import {
    Error as WaringIcon,
    AccessTimeFilled as PendingIcon,
    CheckCircle as SuccessIcon,
    Help as LoadingQuestionIcon,
    KeyboardArrowDown as DownIcon
} from '@mui/icons-material';

import styles from './InfoCard.module.scss'
import { NOTIFICATION_TYPE, NotificationType } from "@/utils/enum";
import { Notification } from "@/type/electron";
import { useEffect, useState } from "react";


interface Props {
    notifications: Notification[]
}
const InfoCard: React.FC<Props> = ({
    // notifications
}) => {

    const [isCollapsed, setIsCollapsed] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // 接收后台的消息推送
    useEffect(() => {
        window.electronAPI.onSystemInfo((data) => {
            setNotifications([data, ...notifications])
        })
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