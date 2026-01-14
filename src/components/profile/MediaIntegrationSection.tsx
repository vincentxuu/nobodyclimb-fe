'use client'

import React from 'react'
import { Youtube, Instagram } from 'lucide-react'
import { MediaSection } from '@/components/biography/media/media-section'
import { SocialLinks } from './types'

interface MediaIntegrationSectionProps {
  biographyId: string | null
  isEditing: boolean
  isMobile: boolean
  socialLinks: SocialLinks
  onSocialLinksChange: (field: keyof SocialLinks, value: string) => void
}

export default function MediaIntegrationSection({
  biographyId,
  isEditing,
  isMobile,
  socialLinks,
  onSocialLinksChange,
}: MediaIntegrationSectionProps) {
  if (!biographyId) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-6 text-center">
        <div className="mb-2 flex justify-center gap-4">
          <Youtube className="h-8 w-8 text-gray-400" />
          <Instagram className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">儲存人物誌後即可新增影片與社群媒體連結</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 rounded-lg border border-gray-100 ${isMobile ? 'p-3' : 'p-4'}`}>
      {/* 社群連結編輯 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">社群連結</h4>

        {/* Instagram */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">Instagram 用戶名</label>
            {isEditing ? (
              <div className="flex items-center">
                <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  @
                </span>
                <input
                  type="text"
                  value={socialLinks.instagram}
                  onChange={(e) => onSocialLinksChange('instagram', e.target.value.replace('@', ''))}
                  placeholder="username"
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-900">
                {socialLinks.instagram ? `@${socialLinks.instagram}` : '尚未設定'}
              </p>
            )}
          </div>
        </div>

        {/* YouTube */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-600">
            <Youtube className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">YouTube 頻道</label>
            {isEditing ? (
              <div className="flex items-center">
                <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  @
                </span>
                <input
                  type="text"
                  value={socialLinks.youtube_channel}
                  onChange={(e) => onSocialLinksChange('youtube_channel', e.target.value.replace('@', ''))}
                  placeholder="channel"
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-900">
                {socialLinks.youtube_channel ? `@${socialLinks.youtube_channel}` : '尚未設定'}
              </p>
            )}
          </div>
        </div>

        {!isEditing && (socialLinks.instagram || socialLinks.youtube_channel) && (
          <p className="text-xs text-gray-400">點擊「編輯」按鈕可修改社群連結</p>
        )}
      </div>

      {/* 分隔線 */}
      <div className="border-t border-gray-100" />

      {/* YouTube 影片 */}
      <MediaSection biographyId={biographyId} isOwner={isEditing} />
    </div>
  )
}
