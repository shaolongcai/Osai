import { Paper, Stack, Typography, Button, Switch } from "@mui/material"
import { useTranslation } from '@/contexts/I18nContext';


type ActionType = 'button' | 'switch' | 'custom' | 'text'

interface Props {
    title: string;
    value?: string | boolean;
    type: ActionType;
    onAction?: (checked: boolean) => void;
    action?: React.ReactNode;
    disabled?: boolean;
}

const SettingItem: React.FC<Props> = ({
    title,
    value,
    type,
    onAction,
    action,
    disabled = false,
}) => {

    const { t } = useTranslation();

    // 渲染末位的操作
    const generateAction = (type: ActionType) => {
        switch (type) {
            case 'button':
                return (
                    <Button
                        sx={{
                            '&:focus': {
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none'
                            },
                            '&:active': {
                                outline: 'none',
                                border: 'none',
                                boxShadow: 'none'
                            },
                            '&:hover': {
                                border: 'none'
                            }
                        }}
                        variant='text'
                        onClick={() => {
                            window.electronAPI.openDir('runLog')
                        }}>
                        {t('app.settings.open')}
                    </Button>
                )
            case 'switch':
                return (
                    <Switch
                        checked={value as boolean}
                        onChange={(_e, checked) => onAction(checked)}
                        disabled={disabled}
                    />
                )
            case 'text':
                return (
                    <Typography variant='bodyMedium' color="text.primary" >
                        {value}
                    </Typography>
                )
            case 'custom':
                return action
            default:
                break;
        }
    }

    return (
        <Paper className="border border-border" variant='outlined' sx={{
            padding: '16px',
        }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='bodySmall' color="text.secondary" className="font-semibold" >
                    {title}
                </Typography>
                {generateAction(type)}
            </Stack>
        </Paper>
    )
}

export default SettingItem;
