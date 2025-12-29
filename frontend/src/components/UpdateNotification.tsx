import { Button, Stack, Typography } from "@mui/material";
import updateImage from '@/assets/images/update.png';
import { useTranslation } from '@/contexts/I18nContext';
import { useCallback } from "react";


interface Props {
    onFinish: () => void;
}
const UpdateNotification: React.FC<Props> = ({
    onFinish
}) => {

    const { t } = useTranslation();

    // 处理更新
    const handleUpdate = useCallback(async () => {
        try {
            await window.electronAPI.downloadUpdate();
        } catch (error) {
            console.error('更新失败', error);
        } finally {
            onFinish();
        }
    }, [onFinish]);

    return <Stack spacing={2} alignItems="center">
        <img src={updateImage} alt="init" className="w-45 h-45" />
        <Typography variant='bodyLarge' color='textPrimary' >
            {t('app.preload.updateContent')}
        </Typography>
        <Stack spacing={1} alignItems="center">
            <Button
                variant="contained"
                color="primary"
                onClick={handleUpdate}
            >
                {t('app.preload.updatePrimary')}
            </Button>
            <Button variant="outlined" className="w-fit" onClick={onFinish}>
                {t('app.preload.updateSecondary')}
            </Button>
        </Stack>
    </Stack>
}

export default UpdateNotification