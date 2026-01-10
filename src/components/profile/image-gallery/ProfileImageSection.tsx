'use client'

import React from 'react'
import { ImageIcon } from 'lucide-react'
import ImageUploader from './ImageUploader'
import ImagePreviewCard from './ImagePreviewCard'
import LayoutSelector from './LayoutSelector'
import ImageGalleryDisplay from './ImageGalleryDisplay'
import ProfileFormField from '../ProfileFormField'
import { ProfileImage, ImageLayout } from '../types'

interface ProfileImageSectionProps {
  images: ProfileImage[]
  imageLayout: ImageLayout
  isEditing: boolean
  isMobile: boolean
  onImageUpload: (file: File) => Promise<void>
  onImageDelete: (id: string) => void
  onCaptionChange: (id: string, caption: string) => void
  onLayoutChange: (layout: ImageLayout) => void
}

export default function ProfileImageSection({
  images,
  imageLayout,
  isEditing,
  isMobile,
  onImageUpload,
  onImageDelete,
  onCaptionChange,
  onLayoutChange,
}: ProfileImageSectionProps) {
  const sortedImages = [...images].sort((a, b) => a.order - b.order)

  // 查看模式
  if (!isEditing) {
    if (images.length === 0) {
      return null // 沒有圖片時不顯示這個區塊
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-base font-medium text-gray-700 md:text-lg">我的攀岩照片</h3>
        </div>
        <ImageGalleryDisplay images={images} layout={imageLayout} />
      </div>
    )
  }

  // 編輯模式
  return (
    <div className="space-y-4">
      <ProfileFormField label="我的攀岩照片" isMobile={isMobile}>
        <div className="space-y-4">
          {/* 排版選擇 */}
          <LayoutSelector
            value={imageLayout}
            onChange={onLayoutChange}
            disabled={images.length === 0}
          />

          {/* 已上傳的圖片 */}
          {sortedImages.length > 0 && (
            <div
              className={`grid gap-3 ${
                imageLayout === 'single'
                  ? 'grid-cols-1'
                  : imageLayout === 'double'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
              }`}
            >
              {sortedImages.map((image) => (
                <ImagePreviewCard
                  key={image.id}
                  image={image}
                  isEditing={isEditing}
                  onDelete={onImageDelete}
                  onCaptionChange={onCaptionChange}
                />
              ))}
            </div>
          )}

          {/* 上傳區域 */}
          <ImageUploader
            onUpload={onImageUpload}
            currentCount={images.length}
          />
        </div>
      </ProfileFormField>
    </div>
  )
}
