import { Stack, Typography } from "@mui/material"
import Dialog from "../Dialog/Dialog"
import image from '@/assets/images/ai-mark.png'
import { useTranslation } from "../../contexts/I18nContext";



const UpdateTipsDialog = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
    const { t } = useTranslation();
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={t('app.updateTips.title')}
            primaryButtonText={t('app.updateTips.primaryButtonText')}
            onPrimaryButtonClick={onClose}
        >
            <Stack alignItems="center">
                <img src={image} alt="" style={{ width: 400, marginBottom: 2 }} />
                <Typography variant="bodyMedium" sx={{
                    whiteSpace: "pre-line",
                    color: 'rgba(0, 0, 0, 0.85) !important',
                    lineHeight: 1.8,
                }}>
                    {t('app.updateTips.content')}
                </Typography>
            </Stack>
        </Dialog>
    )
}

export default UpdateTipsDialog
