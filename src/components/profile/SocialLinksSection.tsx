'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import ProfileFormField from './ProfileFormField'
import { Instagram, Youtube } from 'lucide-react'
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
  const handleFieldChange = (field: keyof SocialLinks, value: string) => {
    onChange('socialLinks', {
      ...socialLinks,
      [field]: value,
    })
  }

  return (
    <div className="space-y-4">
      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-[#1B1A1A]`}>
        社群連結
      </h3>
      <p className="text-sm text-[#6D6C6C]">
        新增您的社群帳號，讓其他攀岩者可以追蹤您的動態
      </p>

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
            <span className="text-sm text-[#8E8C8C]">尚未設定</span>
          )}
        </ProfileFormField>

        <ProfileFormField
          label={
            <span className="flex items-center gap-2">
              <Youtube size={16} className="text-red-600" />
              YouTube 頻道
            </span>
          }
          isMobile={isMobile}
        >
          {isEditing ? (
            <Input
              value={socialLinks.youtube_channel}
              onChange={(e) => handleFieldChange('youtube_channel', e.target.value)}
              placeholder="頻道 ID 或網址"
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
            <span className="text-sm text-[#8E8C8C]">尚未設定</span>
          )}
        </ProfileFormField>
      </div>
    </div>
  )
}
