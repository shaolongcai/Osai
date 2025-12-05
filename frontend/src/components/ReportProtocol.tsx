import { Button, Checkbox, FormControlLabel, Paper, Stack, Typography } from "@mui/material"
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
        <Paper elevation={1} className="p-4">
            <Stack spacing={2} alignItems="center" textAlign="center">
                <Typography variant='titleMedium' color="text.primary"
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
                <FormControlLabel
                    sx={{
                        marginTop: '16px'
                    }}
                    control={<Checkbox checked={isRemind} onChange={(_e, check) => setIsRemind(check)} />}
                    label={<Typography sx={{ color: 'rgba(0,0,0,0.45)', fontSize: '14px' }}>{t('app.reportProtocol.notRemindLabel')}</Typography>}
                />
                <Stack spacing={1}>
                    <Button onClick={agree} variant="contained">
                        {t('app.reportProtocol.primaryButtonText')}
                    </Button>
                    <Button variant="outlined" onClick={handleClose}>
                        {t('app.reportProtocol.secondaryButtonText')}
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    )
}

export default ReportProtocol;