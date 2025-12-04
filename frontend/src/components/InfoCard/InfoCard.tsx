import { Card, CardContent, Stack, Tooltip, Typography, CircularProgress, Collapse, Fade } from "@mui/material";
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
import { useGlobalContext } from "@/contexts/globalContext";
import { useTranslation } from '@/contexts/I18nContext';

interface Props {

}
const InfoCard: React.FC<Props> = ({

}) => {

    const [isCollapsed, setIsCollapsed] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const context = useGlobalContext();
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
        <Card className="rounded-xl min-w-[338px] relative">
            <DownIcon className="absolute top-6 right-4 cursor-pointer" fontSize='medium'
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
                                className="min-w-[128px] "
                                alignItems='center'
                                spacing={1}
                            // justifyContent='space-between'
                            >
                                <Typography variant='bodyMedium' component="div" className="text-text-secondary">
                                    {(() => {
                                        // 根據通知 id 與文本做翻譯映射
                                        if (item.id === 'visual-index') {
                                            if (item.text?.includes('暂停')) {
                                                return t('app.visualIndexStatus.paused');
                                            }
                                            if (item.text?.includes('自动关闭')) {
                                                return t('app.visualIndexStatus.paused');
                                            }
                                            if (item.text?.includes('已全部完成')) {
                                                return t('app.visualIndexStatus.finished');
                                            }
                                            // 處理 "OCR 服务已启动 剩余 X" 的情況
                                            if (item.text?.includes('剩余') || item.text?.includes('剩餘')) {
                                                // 提取數字
                                                const match = item.text.match(/\d+/);
                                                const count = match ? parseInt(match[0]) : 0;
                                                return t('app.visualIndexStatus.running', { count });
                                            }
                                        }
                                        if (item.id === 'download-progress') {
                                            // 下載進度類型，text 已是百分比，直接顯示
                                            return item.text;
                                        }
                                        if (item.id === 'ai-mark') {
                                            if (item.text?.includes('已完成')) {
                                                return t('app.aiMarkStatus.completed');
                                            }
                                            if (item.text?.includes('正在分析')) {
                                                return t('app.aiMarkStatus.analyzing');
                                            }
                                            if (item.text?.includes('正在记录')) {
                                                return t('app.aiMarkStatus.recording');
                                            }
                                            return item.text;
                                        }
                                        // 索引任務問題
                                        if (item.id === 'indexTask') {
                                            return item.text;
                                        }
                                        // 默認直接顯示
                                        return item.text;
                                    })()}
                                </Typography>
                                <Tooltip title={item.tooltip} arrow className="max-w-[120px]" >
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