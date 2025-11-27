import React from 'react'
import { Link, Stack, Typography } from "@mui/material"
import weChatQrcode from '@/assets/images/weChat.png'
import { useTranslation } from '@/contexts/I18nContext'

interface Props {
  title?: string;
}

const Contact: React.FC<Props> = ({ title }) => {
  const { t } = useTranslation();
  const displayTitle = title ?? t('app.contact.title');

  return (
    <Stack spacing={2} alignItems='center'>
      <Typography className="text-base font-semibold text-center leading-6 text-text-secondary">
        {displayTitle}
      </Typography>
      <Link
        href='https://discord.gg/qJHfsGXTzP'
        target='_blank'
        className="text-base font-semibold text-[#1890FF]"
        underline='none'
      >
        {t('app.contact.joinDiscord')}
      </Link>
      <Stack alignItems='center' spacing={1}>
        <img src={weChatQrcode} style={{ width: '160px' }} />
        <Typography variant='body2'>
          {t('app.contact.addWechat')}
        </Typography>
      </Stack>
    </Stack>
  )
}

export default Contact