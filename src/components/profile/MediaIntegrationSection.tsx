'use client'

import React from 'react'
import { Youtube, Instagram } from 'lucide-react'
import { MediaSection } from '@/components/biography/media/media-section'

interface MediaIntegrationSectionProps {
  biographyId: string | null
  isEditing: boolean
  isMobile: boolean
}

export default function MediaIntegrationSection({
  biographyId,
  isEditing,
  isMobile,
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
    <div className={`rounded-lg border border-gray-100 ${isMobile ? 'p-3' : 'p-4'}`}>
      <MediaSection biographyId={biographyId} isOwner={isEditing} />
    </div>
  )
}
