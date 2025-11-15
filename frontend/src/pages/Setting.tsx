import { Paper, Stack, Typography } from "@mui/material"
import { useState } from "react";
import {
    Settings as SettingsIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import RootProviders from "@/RootProviders";


interface SettingButtonProps {
    openSetting: boolean;
    setOpenSetting: (value: boolean) => void;
}
/**
 * 设置按钮
 */
const SettingButton = ({ openSetting, setOpenSetting }: SettingButtonProps) => {
    return <Paper
        className='rounded-b-lg '
        elevation={3}
        onClick={() => {
            setOpenSetting(!openSetting);
        }}
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            height: '40px',
            width: '40px',
        }}
    >
        {
            openSetting ?
                <CloseIcon
                    fontSize='small'
                    sx={{
                        color: 'rgba(0, 0, 0, 0.85)',
                    }} />
                :
                <SettingsIcon
                    fontSize='small'
                    sx={{
                        color: 'rgba(0, 0, 0, 0.85)',
                    }} />
        }
    </Paper>
}


/**
 * 设置面板(主界面)
 */
const Setting = () => {

    const [openSetting, setOpenSetting] = useState(false);

    return <RootProviders>
        <Stack
            sx={{
                marginTop: '16px',
                boxSizing: 'border-box',
            }}
            alignItems='flex-end' spacing={2}
        >
            {/* 设置按钮 */}
            <SettingButton
                openSetting={openSetting}
                setOpenSetting={setOpenSetting}
            />
            {
                openSetting &&
                <Paper sx={{
                    width: '480px',
                    height: '580px',
                }}>
                    <Typography variant='headlineLarge'>
                        设置
                    </Typography>
                </Paper>
            }
        </Stack>
    </RootProviders>
}


export default Setting;