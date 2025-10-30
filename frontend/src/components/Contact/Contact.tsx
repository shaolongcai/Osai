import { Link, Stack, Typography } from "@mui/material"
import weChatQrcode from '@/assets/images/weChat.png'
import styles from './Contact.module.scss'


interface Props {
    title?: string;
}
const Contact: React.FC<Props> = ({
    title = '应该有结果，但却没有？请告知我们持续改进。'
}) => {

    return <Stack spacing={2} alignItems='center' className={styles.root}>
        <Typography className={styles.text}>
            {title}
        </Typography>
        <Link
            href='https://discord.gg/JadKcXmN'
            target='_blank'
            className={styles.link}
            underline='none'
        >
            加入Discord
        </Link>
        <Stack alignItems='center' spacing={1}>
            <img src={weChatQrcode} style={{ width: '160px' }} />
            <Typography variant='body2'>
                添加微信
            </Typography>
        </Stack>
    </Stack>
}

export default Contact