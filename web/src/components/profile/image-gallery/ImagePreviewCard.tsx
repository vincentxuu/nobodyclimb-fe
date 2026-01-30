'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X, GripVertical } from 'lucide-react'
import { ProfileImage } from '../types'

interface ImagePreviewCardProps {
  image: ProfileImage
  isEditing: boolean
  // eslint-disable-next-line no-unused-vars
  onDelete: (_id: string) => void
  // eslint-disable-next-line no-unused-vars
  onCaptionChange?: (_id: string, _caption: string) => void
  isDraggable?: boolean
}

export default function ImagePreviewCard({
  image,
  isEditing,
  onDelete,
  onCaptionChange,
  isDraggable = false,
}: ImagePreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [captionValue, setCaptionValue] = useState(image.caption || '')

  const handleCaptionBlur = () => {
    setIsEditingCaption(false)
    if (onCaptionChange && captionValue !== image.caption) {
      onCaptionChange(image.id, captionValue)
    }
  }

  const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCaptionBlur()
    }
    if (e.key === 'Escape') {
      setCaptionValue(image.caption || '')
      setIsEditingCaption(false)
    }
  }

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container with aspect ratio */}
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={image.url}
          alt={image.caption || '攀岩照片'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Overlay for editing mode */}
        {isEditing && (isHovered || isDraggable) && (
          <div className="absolute inset-0 bg-black/30 transition-opacity" />
        )}

        {/* Delete button */}
        {isEditing && (
          <button
            onClick={() => onDelete(image.id)}
            className={`
              absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white
              transition-opacity hover:bg-red-600
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
            aria-label="刪除圖片"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Drag handle */}
        {isEditing && isDraggable && (
          <div
            className={`
              absolute left-2 top-2 cursor-grab rounded bg-black/60 p-1 text-white
              transition-opacity active:cursor-grabbing
              ${isHovered ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="p-2">
        {isEditing ? (
          isEditingCaption ? (
            <input
              type="text"
              value={captionValue}
              onChange={(e) => setCaptionValue(e.target.value)}
              onBlur={handleCaptionBlur}
              onKeyDown={handleCaptionKeyDown}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none"
              placeholder="輸入圖片說明..."
              autoFocus
              maxLength={100}
            />
          ) : (
            <button
              onClick={() => setIsEditingCaption(true)}
              className="w-full rounded px-2 py-1 text-left text-sm text-gray-500 hover:bg-gray-100"
            >
              {captionValue || '點擊新增說明...'}
            </button>
          )
        ) : (
          image.caption && (
            <p className="text-sm text-gray-600">{image.caption}</p>
          )
        )}
      </div>
    </div>
  )
}
