import { Button, Stack, Typography } from "@mui/material"
import loginImg from '@/assets/images/login.png'
import googleIcon from '@/assets/icons/google.svg';


interface Props {
    onFinish: () => void; //完成的回调
}
/**
 * 登录组件
 */
const Login: React.FC<Props> = ({
    onFinish,
}) => {
    return (
        <>
            <Stack spacing={2} alignItems="center">
                <img src={loginImg} alt="init" className="w-45 h-45" />
                <Typography variant='bodyLarge' color='textPrimary' >
                    Login to enjoy more services
                </Typography>
                <Stack spacing={1} alignItems="center">
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<img src={googleIcon} alt="google" className="w-6 h-6" />}
                        onClick={onFinish}
                    >
                        WHIT GOOGLE
                    </Button>
                    <Button variant="outlined" className="w-fit" onClick={onFinish}>
                        later
                    </Button>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center" className="mt-8!">
                    <span className="border border-text-secondary rounded px-2 py-1 text-xs leading-none">Alt</span>
                    <Typography variant="bodyMedium" color="textSecondary">+</Typography>
                    <span className="border border-text-secondary rounded px-2 py-1 text-xs leading-none">space</span>
                    <Typography variant="bodyMedium" color="textSecondary">
                        to hide/show the app
                    </Typography>
                </Stack>
            </Stack>
        </>
    )
}

export default Login