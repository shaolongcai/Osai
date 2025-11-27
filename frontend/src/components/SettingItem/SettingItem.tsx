import { Paper, Stack, Typography, Button, Switch } from "@mui/material"



type ActionType = 'button' | 'switch' | 'custom'

interface Props {
    title: string;
    value?: string | boolean;
    type: ActionType;
    onAction: (checked: boolean) => void;
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
                        打开
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
            case 'custom':
                return action
            default:
                break;
        }
    }

    return (
        <Paper className="p-4 rounded-xl border border-border" elevation={0} variant='outlined' >
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant="body1" className="text-sm font-semibold text-text-secondary" >
                    {title}
                </Typography>
                {generateAction(type)}
            </Stack>
        </Paper>
    )
}

export default SettingItem;
