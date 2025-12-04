import { Button, MobileStepper, Stack, Typography } from "@mui/material"
import guide1Img from '@/assets/images/guide1.png'
import guide2Img from '@/assets/images/guide2.png'
import guide3Img from '@/assets/images/guide3.png'
import guide4Img from '@/assets/images/guide4.png'
import { useState } from "react";


interface Props {
    onFinish: () => void; //登录成功回调
}
/**
 * 登录组件
 */
const Guide: React.FC<Props> = ({
    onFinish,
}) => {

    const [activeStep, setActiveStep] = useState(0);

    // 步骤对应的文案与图片
    const steps = [
        {
            title: 'Osai will remember the files you have opened',
            image: guide1Img,
        },
        {
            title: 'Search by content even if you forget the title.',
            image: guide2Img,
        },
        {
            title: 'Install AI to unlock powerful intelligence for Osai.',
            image: guide3Img,
        },
        {
            title:'All content stays local and 100% private lock.',
            // title: 'All content, whether data or AI, is completed locally, with 100% private lock.',
            image: guide4Img,
        },
    ];

    return (
        <>
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
                            onClick={onFinish}
                        >
                            Finish
                        </Button>
                        :
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setActiveStep(activeStep + 1)}
                        >
                            Next
                        </Button>
                }
            </Stack>
        </>
    )
}

export default Guide