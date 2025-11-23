import { Checkbox, FormControlLabel, Typography } from "@mui/material"
import Dialog from "../Dialog/Dialog"
import { useState } from "react";
import { ConfigParams } from "@/types/electron";
import { useTranslation } from "../../contexts/I18nContext";


interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm?: () => void;
}

/**
 * 允许应用向服务端报告崩溃、BUG的协议
 */
const ReportProtocol: React.FC<Props & { hideBackdrop?: boolean }> = ({
    open,
    onClose,
    onConfirm,
    hideBackdrop = false,
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
        onConfirm?.();
        onClose();
    }

    // 关闭弹窗
    const handleClose = async () => {
        await setNotRemind();
        onClose();
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
        <Dialog
            open={open}
            onClose={onClose}
            title={t('app.reportProtocol.title')}
            primaryButtonText={t('app.reportProtocol.primaryButtonText')}
            secondaryButtonText={t('app.reportProtocol.secondaryButtonText')}
            onPrimaryButtonClick={agree}
            onSecondaryButtonClick={handleClose}
            hideBackdrop={hideBackdrop}
        >
            <>
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
            </>
        </Dialog>
    )
}

export default ReportProtocol;