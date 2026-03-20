'use client'

import { Link, Instagram, Youtube } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { SocialLinks } from '@/lib/types/biography-v2'

interface SocialLinksEditorSectionProps {
  socialLinks: SocialLinks
  onSocialLinksChange: (_socialLinks: SocialLinks) => void
  className?: string
}

/**
 * Social Links Editor Section
 *
 * Edit social links (Instagram, YouTube, etc.)
 */
export function SocialLinksEditorSection({
  socialLinks,
  onSocialLinksChange,
  className,
}: SocialLinksEditorSectionProps) {
  const t = useTranslations('BiographyEditor')

  const handleChange = (field: keyof SocialLinks, value: string) => {
    onSocialLinksChange({
      ...socialLinks,
      [field]: value || undefined,
    })
  }

  // Extract username from URL if user pastes full URL
  const extractUsername = (value: string) => {
    if (!value) return ''

    try {
      // Handle full URLs
      if (value.includes('/')) {
        const parts = value.split('/').filter(Boolean)
        const username = parts.pop() || ''
        // Remove @ prefix if present
        return username.replace(/^@/, '')
      }
      // Handle @ prefix
      return value.replace(/^@/, '')
    } catch {
      return value
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Link size={18} className="text-[#3F3D3D]" />
        <h3 className="font-semibold text-[#1B1A1A]">{t('socialLinksTitle')}</h3>
      </div>

      <p className="text-sm text-[#6D6C6C]">
        {t('socialLinksHint')}
      </p>

      {/* Instagram */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
          <Instagram size={16} className="text-pink-600" />
          {t('instagramLabel')}
          <span className="text-[#8E8C8C] font-normal">{t('instagramOptional')}</span>
        </label>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#6D6C6C] shrink-0">@</span>
          <input
            type="text"
            value={socialLinks.instagram || ''}
            onChange={(e) => handleChange('instagram', e.target.value)}
            onBlur={(e) => {
              const username = extractUsername(e.target.value)
              if (username !== e.target.value) {
                handleChange('instagram', username)
              }
            }}
            placeholder="your_username"
            className="flex-1 min-w-0 px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
            maxLength={50}
          />
        </div>
        <p className="text-xs text-[#8E8C8C]">{t('instagramHint')}</p>
      </div>

      {/* YouTube */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
          <Youtube size={16} className="text-red-600" />
          {t('youtubeLabel')}
          <span className="text-[#8E8C8C] font-normal">{t('youtubeOptional')}</span>
        </label>
        <input
          type="text"
          value={socialLinks.youtube || ''}
          onChange={(e) => handleChange('youtube', e.target.value)}
          onBlur={(e) => {
            const username = extractUsername(e.target.value)
            if (username !== e.target.value) {
              handleChange('youtube', username)
            }
          }}
          placeholder={t('youtubePlaceholder')}
          className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={100}
        />
        <p className="text-xs text-[#8E8C8C]">{t('youtubeHint')}</p>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
          <Link size={16} className="text-[#3F3D3D]" />
          {t('websiteLabel')}
          <span className="text-[#8E8C8C] font-normal">{t('websiteOptional')}</span>
        </label>
        <input
          type="url"
          value={socialLinks.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://your-website.com"
          className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={200}
        />
        <p className="text-xs text-[#8E8C8C]">{t('websiteHint')}</p>
      </div>
    </div>
  )
}

export default SocialLinksEditorSection
