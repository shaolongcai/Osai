import { Button, Card, Checkbox, FormControlLabel, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react";
import { ConfigParams } from "@/types/electron";
import { useTranslation } from "../contexts/I18nContext";


interface Props {
    onFinish: () => void;
}

/**
 * 允许应用向服务端报告崩溃、BUG的协议
 */
const ReportProtocol: React.FC<Props & { hideBackdrop?: boolean }> = ({
    onFinish,
}) => {

    const [isRemind, setIsRemind] = useState(false);
    const { t } = useTranslation();

    // 同意协议
    const agree = async () => {
        console.log('同意协议')
        const params: ConfigParams = {
            key: 'report_agreement',
            value: true,
            type: 'boolean',
        }
        await window.electronAPI.setConfig(params);  // 接口设置同意
        await setNotRemind();
        onFinish();
    }

    // 关闭弹窗
    const handleClose = async () => {
        await setNotRemind();
        onFinish();
    }

    // 设置不再提醒
    const setNotRemind = async () => {
        const params: ConfigParams = {
            key: 'not_remind_again',
            value: isRemind,
            type: 'boolean',
        }
        await window.electronAPI.setConfig(params);  // 接口设置不再提醒
    }

    return (
        <Card >
            <Stack spacing={2} >
                <Typography variant='titleLarge' color="text.primary"
                >
                    {t('app.reportProtocol.title')}
                </Typography>
                <Typography sx={{
                    whiteSpace: 'pre-line',
                    color: 'rgba(0,0,0,0.65)',
                    fontSize: '14px'
                }}
                >
                    {t('app.reportProtocol.content')}
                </Typography>
                <Stack spacing={1} alignItems="center">
                    <Button onClick={agree} variant="contained"  className="w-24 ">
                        {t('app.reportProtocol.primaryButtonText')}
                    </Button>
                </Stack>
            </Stack>
        </Card>
    )
}

export default ReportProtocol;