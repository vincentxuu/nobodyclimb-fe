'use client'

import { Link, Instagram, Youtube } from 'lucide-react'
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
        <h3 className="font-semibold text-[#1B1A1A]">社群連結</h3>
      </div>

      <p className="text-sm text-[#6D6C6C]">
        新增你的社群帳號，讓其他岩友可以追蹤你的動態
      </p>

      {/* Instagram */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
          <Instagram size={16} className="text-pink-600" />
          Instagram
          <span className="text-[#8E8C8C] font-normal">(選填)</span>
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
        <p className="text-xs text-[#8E8C8C]">輸入你的 Instagram 用戶名（不含 @）</p>
      </div>

      {/* YouTube */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
          <Youtube size={16} className="text-red-600" />
          YouTube 頻道
          <span className="text-[#8E8C8C] font-normal">(選填)</span>
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
          placeholder="頻道 ID 或網址"
          className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={100}
        />
        <p className="text-xs text-[#8E8C8C]">輸入你的 YouTube 頻道 ID 或網址</p>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#3F3D3D] flex items-center gap-2">
          <Link size={16} className="text-[#3F3D3D]" />
          個人網站
          <span className="text-[#8E8C8C] font-normal">(選填)</span>
        </label>
        <input
          type="url"
          value={socialLinks.website || ''}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="https://your-website.com"
          className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] placeholder:text-[#9D9D9D] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors"
          maxLength={200}
        />
        <p className="text-xs text-[#8E8C8C]">你的個人網站或部落格</p>
      </div>
    </div>
  )
}

export default SocialLinksEditorSection
