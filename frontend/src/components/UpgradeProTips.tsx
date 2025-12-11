import { Button, Card, Paper, Stack, Typography } from "@mui/material"
import UpgradeProImg from '@/assets/images/upgrade.png';


interface Props {
    onFinish: () => void
}
/**
 * 升级为pro的tips
 */
const UpgradeProTips: React.FC<Props> = ({
    onFinish
}) => {
    return <Card className='p-6'>
        <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
            <Typography variant='titleMedium'>
                Upgrade to Pro，Unlock AI enhanced and More
            </Typography>
            <img src={UpgradeProImg} alt="Upgrade to Pro" className='w-45 h-45' />
            <Typography variant='bodyLarge' color='text.primary' className='text-center whitespace-pre-line leading-relaxed! '>
                {`📌 AI-powered file summary & tags — find files easier
                    📌 Truly understand images, not just OCR-searchable
                    📌 Experience Beta Features First.
                    And more pro feature coming soon
                `}
            </Typography>
            <Stack spacing={1}>
                <Button variant='contained' onClick={onFinish}>
                    Upgrade to Pro
                </Button>
                <Button variant='outlined' onClick={onFinish}>
                    Later
                </Button>
            </Stack>
        </Stack>
    </Card>
}

export default UpgradeProTips;