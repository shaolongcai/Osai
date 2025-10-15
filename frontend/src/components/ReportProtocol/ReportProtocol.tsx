import { Checkbox, FormControlLabel, Typography } from "@mui/material"
import Dialog from "../Dialog/Dialog"
import { useState } from "react";
import { ConfigParams } from "@/type/electron";


interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm?: () => void;
}

/**
 * 允许应用向服务端报告崩溃、BUG的协议
 */
const ReportProtocol: React.FC<Props> = ({
    open,
    onClose,
    onConfirm,
}) => {

    const [isRemind, setIsRemind] = useState(false);

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
            title="用户体验改进计划"
            primaryButtonText="同意"
            secondaryButtonText="稍后"
            onPrimaryButtonClick={agree}
            onSecondaryButtonClick={handleClose}
        >
            <>
                <Typography sx={{
                    whiteSpace: 'pre-line',
                    color: 'rgba(0,0,0,0.65)',
                    fontSize: '14px'
                }}
                >
                    {
                        `为更好改进你的体验，持续发现并修复问题，本功能将自动上传匿名信息。这些信息仅包含：

                📌 程序异常：如闪退、错误代码等。
                📌 性能数据：如下载速度、操作响应时间、功能使用频率（匿名）等。

          此过程绝不会收集或上传您的任何个人身份信息、文件内容、聊天记录、密码或浏览历史等敏感数据。
          
          你可以随时在【设置】中关闭该协议`
                    }
                </Typography>
                <FormControlLabel
                    sx={{
                        marginTop: '16px'
                    }}
                    control={<Checkbox checked={isRemind} onChange={(_e, check) => setIsRemind(check)} />}
                    label={<Typography sx={{ color: 'rgba(0,0,0,0.45)', fontSize: '14px' }}>不再显示</Typography>}
                />
            </>
        </Dialog>
    )
}

export default ReportProtocol;