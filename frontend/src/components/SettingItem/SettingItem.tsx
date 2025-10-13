import { Paper, Stack, Typography, Button, Switch } from "@mui/material"
import styles from './SettingItem.module.scss'



type ActionType = 'button' | 'switch'

interface Props {
    title: string;
    value?: string | boolean;
    type: ActionType;
    onAction: (checked: boolean) => void;
}

const SettingItem: React.FC<Props> = ({
    title,
    value,
    type,
    onAction,
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
                    />
                )
            default:
                break;
        }
    }

    return (
        <Paper className={styles.root} elevation={0} variant='outlined' >
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant="body1" className={styles.label} >
                    {title}
                </Typography>
                {generateAction(type)}
            </Stack>
        </Paper>
    )
}

export default SettingItem;
