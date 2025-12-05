import React from 'react'
import { Link, Paper, Stack, Typography } from "@mui/material"
import { useTranslation } from '@/contexts/I18nContext'
import DiscordIcon from '@/assets/icons/discord.svg'
import EmailIcon from '@/assets/icons/email.svg'
import { useNotifications } from '@toolpad/core/useNotifications'

interface Props {
  title?: string;
}

const Contact: React.FC<Props> = ({ title }) => {

  const notifications = useNotifications();
  const { t } = useTranslation();

  // 复制邮箱
  const copyEmail = () => {
    navigator.clipboard.writeText('aenou634047622@gmail.com');
    notifications.show('Copied', {
      severity: 'success',
      autoHideDuration: 1800,
    });
  };

  return (
    <Stack spacing={2} alignItems='center' direction='row'>
      <Paper
        variant='outlined'
        onClick={() => window.electronAPI.openExternalUrl('https://discord.gg/qJHfsGXTzP')}
        className='p-4 rounded-[8px]! box-border cursor-pointer'
      >
        <img src={DiscordIcon} className='w-10 h-10' />
      </Paper>
      <Paper
        className='p-4 rounded-[8px]! box-border cursor-pointer'
        variant='outlined' onClick={copyEmail}>
        <img src={EmailIcon} className='w-10 h-10' />
      </Paper>
    </Stack>
  )
}

export default Contact