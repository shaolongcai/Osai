import { Button, Card, MobileStepper, Stack, Typography } from "@mui/material"
import guide1Img from '@/assets/images/guide1.png'
import guide2Img from '@/assets/images/guide2.png'
import guide3Img from '@/assets/images/guide3.png'
import guide4Img from '@/assets/images/guide4.png'
import { useCallback, useState } from "react";
import { useTranslation } from '@/contexts/useI18n';


interface Props {
    onFinish: () => void; //登录成功回调
}
/**
 * 登录组件
 */
const Guide: React.FC<Props> = ({
    onFinish,
}) => {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState(0);

    // 步骤对应的文案与图片
    const steps = [
        {
            title: t('app.guide.step1'),
            image: guide1Img,
        },
        {
            title: t('app.guide.step2'),
            image: guide2Img,
        },
        {
            title: t('app.guide.step3'),
            image: guide3Img,
        },
        {
            title: t('app.guide.step4'),
            image: guide4Img,
        },
    ];

    // 完成引导，并记录
    const handleFinish = useCallback(async () => {
        await window.electronAPI.setConfig({
            key: 'skip_guide',
            value: true,
            type: 'boolean',
        });
        onFinish();
    }, [onFinish]);

    return (
        <Card className="w-[480px] box-border min-h-[400px] flex flex-col items-center justify-center">
            <MobileStepper
                variant='dots'
                steps={4}
                position='static'
                activeStep={activeStep}
                backButton={<></>}
                nextButton={<></>}
                sx={{
                    '& .MuiMobileStepper-dot': {
                        width: 24,
                        height: 4,
                        borderRadius: 2,
                    },
                    '& .MuiMobileStepper-dotActive': {
                        width: 24,
                        height: 4,
                        borderRadius: 2,
                    },
                }}
            />
            <Stack spacing={2} alignItems="center">
                <img src={steps[activeStep].image} alt="init" className="w-45 h-45" />
                <Typography variant='bodyLarge' color="textPrimary" >
                    {steps[activeStep].title}
                </Typography>
                {
                    activeStep === 3 ?
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleFinish}
                        >
                            {t('app.aiMark.buttons.finish')}
                        </Button>
                        :
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setActiveStep(activeStep + 1)}
                        >
                            {t('app.aiMark.buttons.next')}
                        </Button>
                }
            </Stack>
        </Card>
    )
}

export default Guide