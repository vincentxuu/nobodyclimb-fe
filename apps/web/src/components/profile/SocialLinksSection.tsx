'use client'

import { Instagram, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import ProfileFormField from './ProfileFormField'
import { SocialLinks } from './types'

interface SocialLinksSectionProps {
  socialLinks: SocialLinks
  isEditing: boolean
  isMobile: boolean
  // eslint-disable-next-line no-unused-vars
  onChange: (field: string, value: SocialLinks) => void
}

export default function SocialLinksSection({
  socialLinks,
  isEditing,
  isMobile,
  onChange,
}: SocialLinksSectionProps) {
  const t = useTranslations('ProfileUI')
  const handleFieldChange = (field: keyof SocialLinks, value: string) => {
    onChange('socialLinks', {
      ...socialLinks,
      [field]: value,
    })
  }

  return (
    <div className="space-y-4">
      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-[#1B1A1A]`}>
        {t('socialLinksTitle')}
      </h3>
      <p className="text-sm text-[#6D6C6C]">{t('socialLinksSubtitle')}</p>

      <div className="space-y-4">
        <ProfileFormField
          label={
            <span className="flex items-center gap-2">
              <Instagram size={16} className="text-pink-600" />
              Instagram
            </span>
          }
          isMobile={isMobile}
        >
          {isEditing ? (
            <div className="flex items-center">
              <span className="mr-2 text-sm text-[#6D6C6C]">@</span>
              <Input
                value={socialLinks.instagram}
                onChange={(e) => handleFieldChange('instagram', e.target.value)}
                onBlur={(e) => {
                  const currentValue = e.target.value
                  const username = currentValue.split('/').filter(Boolean).pop() || ''
                  if (username !== currentValue) {
                    handleFieldChange('instagram', username)
                  }
                }}
                placeholder="your_username"
                className="border-[#B6B3B3] text-sm md:text-base"
              />
            </div>
          ) : socialLinks.instagram ? (
            <a
              href={`https://instagram.com/${socialLinks.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-pink-600 hover:underline"
            >
              @{socialLinks.instagram}
            </a>
          ) : (
            <span className="text-sm text-[#8E8C8C]">{t('notSet')}</span>
          )}
        </ProfileFormField>

        <ProfileFormField
          label={
            <span className="flex items-center gap-2">
              <Youtube size={16} className="text-red-600" />
              {t('youtubeChannelLabel')}
            </span>
          }
          isMobile={isMobile}
        >
          {isEditing ? (
            <Input
              value={socialLinks.youtube_channel}
              onChange={(e) => handleFieldChange('youtube_channel', e.target.value)}
              placeholder={t('youtubeChannelPlaceholder')}
              className="border-[#B6B3B3] text-sm md:text-base"
            />
          ) : socialLinks.youtube_channel ? (
            <a
              href={
                socialLinks.youtube_channel.startsWith('http')
                  ? socialLinks.youtube_channel
                  : `https://youtube.com/${socialLinks.youtube_channel}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline"
            >
              {socialLinks.youtube_channel}
            </a>
          ) : (
            <span className="text-sm text-[#8E8C8C]">{t('notSet')}</span>
          )}
        </ProfileFormField>
      </div>
    </div>
  )
}
