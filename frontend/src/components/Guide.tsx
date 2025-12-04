import { Button, MobileStepper, Stack, Typography } from "@mui/material"
import loginImg from '@/assets/images/login.png'
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

    return (
        <>
            <MobileStepper
                variant='dots'
                steps={4}
                position='static'
                activeStep={activeStep}
            />
            <Stack spacing={2} alignItems="center">
                <img src={loginImg} alt="init" className="w-45 h-45" />
                <Typography variant='bodyMedium' color="inherit"  className="!color-text-secondary text-center">
                    Osai will remember the files you have opened
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