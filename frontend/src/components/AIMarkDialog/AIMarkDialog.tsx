import Dialog from "../Dialog/Dialog"
import phImage from "@/assets/images/weChat.png"
import styles from "./AIMarkDialog.module.scss"
import { useEffect, useState } from "react"
import { Checkbox, FormControlLabel, Stack, Typography } from "@mui/material"



interface Props {
    onClose: () => void
    open: boolean
}
/**
 * 安装AI Mark功能的引导框
 */
const AIMarkDialog: React.FC<Props> = ({
    onClose,
    open,
}) => {


    const [step, setStep] = useState<1 | 2 | 3>(1) //一共3步，第三步为完成后弹出
    const [title, setTitle] = useState("或者你需要AI Mark")
    const [cudaChecked, setCudaChecked] = useState(false)

    useEffect(() => {
        return () => {
            setStep(1)
        }
    }, [open])

    //渲染第一步
    const renderStep1 = () => {
        return (
            <Stack spacing={2}>
                <Stack spacing={1} alignItems="center">
                    <img src={phImage} alt="" className={styles.aiMarkDialogImage} />
                    <Typography variant="body2">右键菜单启动AI mark</Typography>
                </Stack>
                <Stack spacing={1} className={styles.tips}>
                    <Typography variant="bodyMedium">
                        你可以让AI 帮你mark这份文件，AI会对理解与分析这份文件。后续通过AI的理解，你可以更容易找到这份文件：
                    </Typography>
                    <Typography variant="bodyMedium">
                        🧠 AI理解文件：通过AI的理解，你可以更快也更容易地找到这份文件。
                    </Typography>
                    <Typography variant="bodyMedium">
                        🖼️ 摘要图片：真正理解图片的内容，而不仅仅只有OCR。
                    </Typography>
                    <Typography variant="bodyMedium">
                        📖 询问问题：你可以询问关于这份文件的问题（稍后更新）。
                    </Typography>
                </Stack>
            </Stack>
        )
    }


    //渲染第二步
    const renderStep2 = () => {
        return (
            <Stack spacing={2}>
                <Stack spacing={1}>
                    <FormControlLabel control={<Checkbox defaultChecked />} label="AI 模型" disabled />
                    <FormControlLabel control={<Checkbox defaultChecked onChange={(_e, checked) => setCudaChecked(checked)} />} label="CUDA服务（可选：用于GPU加速，仅当你的电脑拥有GPU时可选）" />
                </Stack>
                <Typography variant="bodyMedium" sx={{
                    whiteSpace: "pre-line",
                    color: 'rgba(0, 0, 0, 0.65) !important'
                }}>
                    {`📌 下载大概耗时5~10分钟（似乎你的网络），下载时你仍可使用应用的其他功能。
                    📌 下载时需要联网`}
                </Typography>
            </Stack>
        )
    }

    // 渲染完成的内容
    const renderStep3 = () => {
        return (
            <Stack spacing={1} alignItems="center">
                <img src={phImage} alt="" className={styles.aiMarkDialogImage} />
                <Typography variant="bodyMedium">
                    你可以试试对着文件右键，点击AI Mark，现在AI会记忆你的文件！
                </Typography>
            </Stack>
        )
    }

    // 处理AImark的弹窗
    const handleAiMarkInstall = () => {
        if (step === 1) {
            setStep(2)
            setTitle("AI Mark 将需要以下组件")
        } else if (step === 2) {
            //执行安装
            setStep(3) //测试
        }
        else {
            onClose()
        }
    }


    return <Dialog
        open={open}
        onClose={onClose}
        title={title}
        primaryButtonText={step === 1 ? "下一步" : step === 2 ? "安装" : "完成"}
        secondaryButtonText={step === 3 ? "" : "稍后"}
        onPrimaryButtonClick={handleAiMarkInstall}
    >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
    </Dialog>
}

export default AIMarkDialog