import Dialog from "../Dialog/Dialog"
import aiMarkImage from "@/assets/images/ai-mark.png"
import { useState } from "react"
import { Checkbox, FormControlLabel, Stack, Typography } from "@mui/material"
import { useGlobalContext } from "@/contexts/globalContext"
import { useTranslation } from "@/contexts/useI18n"

interface Props {
    onClose: () => void
    open: boolean
    currentStep?: 1 | 2 | 3 //当前步骤
}
/**
 * 安装AI Mark功能的引导框
 */
const AIMarkDialog: React.FC<Props> = ({
    onClose,
    open,
    currentStep,
}) => {

    const context = useGlobalContext()
    const { t } = useTranslation()

    const [step, setStep] = useState<1 | 2 | 3>(currentStep || 1) //一共3步，第三步为完成后弹出
    const [title, setTitle] = useState(t('app.aiMark.title'))
    const [cudaChecked, setCudaChecked] = useState(context.gpuInfo.hasGPU)

    //渲染第一步
    const renderStep1 = () => {
        return (
            <Stack spacing={2}>
                <Stack spacing={1} alignItems="center">
                    <img src={aiMarkImage} alt="" className="w-[300px] rounded-xl border border-black/25" />
                    <Typography variant="bodyMedium" sx={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                        {t('app.aiMark.step1.entry')}
                    </Typography>
                </Stack>
                <Stack spacing={1} className="text-text-primary">
                    <Typography variant="bodyMedium">
                        {t('app.aiMark.step1.desc')}
                    </Typography>
                    <Typography variant="bodyMedium">
                        {t('app.aiMark.step1.understand')}
                    </Typography>
                    <Typography variant="bodyMedium">
                        {t('app.aiMark.step1.summaryImage')}
                    </Typography>
                    <Typography variant="bodyMedium">
                        {t('app.aiMark.step1.ask')}
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
                    <FormControlLabel control={<Checkbox defaultChecked />} label={t('app.aiMark.step2.model')} disabled />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={cudaChecked}
                                disabled={!context.gpuInfo.hasGPU}
                                onChange={(_e, checked) => setCudaChecked(checked)}
                            />}
                        label={t('app.aiMark.step2.cuda')}
                    />
                </Stack>
                <Typography variant="bodyMedium" sx={{
                    whiteSpace: "pre-line",
                    color: 'rgba(0, 0, 0, 0.65) !important'
                }}>
                    {t('app.aiMark.step2.tips')}
                </Typography>
            </Stack>
        )
    }

    // 渲染完成的内容
    const renderStep3 = () => {
        return (
            <Stack spacing={1} alignItems="center">
                <img src={aiMarkImage} alt="" className="w-[300px] rounded-xl border border-black/25" />
                <Typography variant="bodyMedium">
                    {t('app.aiMark.step3.done')}
                </Typography>
            </Stack>
        )
    }

    // 处理AImark的弹窗
    const handleAiMarkInstall = () => {
        if (step === 1) {
            setStep(2)
            setTitle(t('app.aiMark.requireTitle'))
        } else if (step === 2) {
            //执行安装
            window.electronAPI.installAiServer(cudaChecked)
            onClose()
        }
        else {
            onClose()
        }
    }

    return <Dialog
        open={open}
        onClose={onClose}
        title={step === 3 ? t('app.aiMark.successTitle') : title}
        primaryButtonText={step === 1 ? t('app.aiMark.buttons.next') : step === 2 ? t('app.aiMark.buttons.install') : t('app.aiMark.buttons.finish')}
        secondaryButtonText={step === 3 ? "" : t('app.aiMark.buttons.later')}
        onPrimaryButtonClick={handleAiMarkInstall}
    >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
    </Dialog>
}

export default AIMarkDialog