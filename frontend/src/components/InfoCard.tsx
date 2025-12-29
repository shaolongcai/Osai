import { Card, CardContent, Stack, Tooltip, Typography, CircularProgress, Collapse } from "@mui/material";
import {
    Error as WaringIcon,
    AccessTimeFilled as PendingIcon,
    CheckCircle as SuccessIcon,
    Help as LoadingQuestionIcon,
    KeyboardArrowDown as DownIcon,
    Help as QuestionIcon
} from '@mui/icons-material';

import { NOTIFICATION_TYPE, NotificationType } from "@/utils/enum";
import { Notification } from "@/types/electron";
import { useEffect, useState } from "react";
import { useTranslation } from '@/contexts/useI18n';

const InfoCard: React.FC = () => {

    const [isCollapsed, setIsCollapsed] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const { t } = useTranslation();

    // 接收后台的消息推送
    useEffect(() => {
        window.electronAPI.onSystemInfo((data) => {
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
                return <PendingIcon className="cursor-pointer" color='warning' />
            case NOTIFICATION_TYPE.SUCCESS:
                return <SuccessIcon className="cursor-pointer" color='success' />
            case NOTIFICATION_TYPE.WARNING:
                return <WaringIcon className="cursor-pointer" color='error' />
            case NOTIFICATION_TYPE.LOADING:
                return <CircularProgress className="cursor-pointer" size={24} />
            case NOTIFICATION_TYPE.LOADING_QUESTION:
                return <LoadingQuestionIcon className="cursor-pointer" color='info' />
            case NOTIFICATION_TYPE.QUESTION:
                return <QuestionIcon className="cursor-pointer" color='info' />
            default:
                return null
        }
    }

    return (
        <Card className="
        rounded-xl min-w-[338px] relative
        border border-solid border-[rgba(0,0,0,0.12)]
        border-color: #E0E0E0
        "     
        >
            <DownIcon className="absolute top-6 right-4 cursor-pointer" fontSize='medium'
                onClick={() => setIsCollapsed(!isCollapsed)}
                sx={{
                    //    当 isCollapsed 为 true 时，旋转180度
                    transform: !isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease-in-out'
                }}
            />
            <CardContent className="p-0!">
                <Collapse in={isCollapsed} collapsedSize={24}>
                    <Stack spacing={1}>
                        {notifications.map(item =>
                            <Stack
                                key={item.id}
                                direction='row'
                                className="min-w-[128px] "
                                alignItems='center'
                                spacing={1}
                            // justifyContent='space-between'
                            >
                                <Typography variant='bodyMedium' color='textTertiary'>
                                    {

                                        item.messageKey ?
                                            item.variables ?
                                                t(item.messageKey, item.variables) :
                                                t(item.messageKey)
                                            :
                                            item.text //兼容旧方法
                                    }
                                </Typography>
                                <Tooltip title={t(item.tooltip || '')} arrow className="max-w-[120px]" >
                                    <div className="w-[24px] h-[24px] flex items-center justify-center mx-auto">
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