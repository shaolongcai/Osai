import { Paper, Stack, Typography, Button, Switch } from "@mui/material"
import { useTranslation } from '@/contexts/useI18n';


type ActionType = 'button' | 'switch' | 'custom' | 'text'

interface Props {
    title: string;
    value?: string | boolean;
    type: ActionType;
    onAction?: (value: boolean | string | React.MouseEvent) => void;
    action?: React.ReactNode;
    disabled?: boolean;
}

/**
 * @description 配置项组件
 * @param value 配置项的值，取代按钮或者文字的文案
 * @param type 配置项的类型，决定了渲染的组件
 * @param onAction 配置项的操作函数，参数为配置项的值,switch 为 checked，button 为点击事件,当type为custom时，此参数无效
 * @param action 自定义的操作组件
 * @param disabled 是否禁用
 * @returns 
 */
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
                        onClick={onAction}
                    >
                        {value || t('app.settings.open')}
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
