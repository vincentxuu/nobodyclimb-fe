'use client'

import React from 'react'
import { ImageIcon } from 'lucide-react'
import ImageUploader from './ImageUploader'
import SortableImageGrid from './SortableImageGrid'
import LayoutSelector from './LayoutSelector'
import ImageGalleryDisplay from './ImageGalleryDisplay'
import ProfileFormField from '../ProfileFormField'
import { ProfileImage, ImageLayout } from '../types'

interface ProfileImageSectionProps {
  images: ProfileImage[]
  imageLayout: ImageLayout
  isEditing: boolean
  isMobile: boolean
  // eslint-disable-next-line no-unused-vars
  onImageUpload: (_file: File) => Promise<void>
  // eslint-disable-next-line no-unused-vars
  onImageDelete: (_id: string) => void
  // eslint-disable-next-line no-unused-vars
  onCaptionChange: (_id: string, _caption: string) => void
  // eslint-disable-next-line no-unused-vars
  onLayoutChange: (_layout: ImageLayout) => void
  // eslint-disable-next-line no-unused-vars
  onReorder: (_images: ProfileImage[]) => void
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
  onReorder,
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

          {/* 已上傳的圖片（可拖拽排序） */}
          {sortedImages.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-gray-500">
                拖拽圖片可調整順序
              </p>
              <SortableImageGrid
                images={sortedImages}
                layout={imageLayout}
                onReorder={onReorder}
                onDelete={onImageDelete}
                onCaptionChange={onCaptionChange}
              />
            </div>
          )}

          {/* 上傳區域 */}
          <ImageUploader
            onUpload={onImageUpload}
            currentCount={images.length}
            enableCrop={true}
          />
        </div>
      </ProfileFormField>
    </div>
  )
}
