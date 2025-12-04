import { Button, Stack, Typography } from "@mui/material"
import loginImg from '@/assets/images/login.png'
import googleIcon from '@/assets/icons/google.svg';


interface Props {
    onLoginSuccess: () => void; //登录成功回调
    onLater: () => void; //稍后登录回调
}
/**
 * 登录组件
 */
const Login: React.FC<Props> = ({
    onLoginSuccess,
    onLater
}) => {
    return (
        <>
            <Stack spacing={2} alignItems="center">
                <img src={loginImg} alt="init" className="w-45 h-45" />
                <Typography variant='bodyMedium' color='textSecondary' >
                    Log in to enjoy more services
                </Typography>
                <Stack spacing={1} alignItems="center">
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<img src={googleIcon} alt="google" className="w-6 h-6" />}
                        onClick={onLoginSuccess}
                    >
                        WHIT GOOGLE
                    </Button>
                    <Button variant="outlined" className="w-fit" onClick={onLater}>
                        later
                    </Button>
                </Stack>
            </Stack>
        </>
    )
}

export default Login