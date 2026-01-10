'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import { ProfileImage } from '../types'

interface SortableImageCardProps {
  image: ProfileImage
  onDelete: (id: string) => void
  onCaptionChange: (id: string, caption: string) => void
}

export default function SortableImageCard({
  image,
  onDelete,
  onCaptionChange,
}: SortableImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [captionValue, setCaptionValue] = useState(image.caption || '')
  const [imageLoaded, setImageLoaded] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  const handleCaptionBlur = () => {
    setIsEditingCaption(false)
    if (captionValue !== image.caption) {
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
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-lg bg-gray-100 ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container with aspect ratio */}
      <div className="relative aspect-[4/3] w-full">
        {/* Skeleton loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}

        <Image
          src={image.url}
          alt={image.caption || '攀岩照片'}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/30 transition-opacity" />
        )}

        {/* Delete button */}
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

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={`
            absolute left-2 top-2 cursor-grab rounded bg-black/60 p-1.5 text-white
            transition-opacity active:cursor-grabbing
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          aria-label="拖拽排序"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Order badge */}
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
          {image.order + 1}
        </div>
      </div>

      {/* Caption */}
      <div className="p-2">
        {isEditingCaption ? (
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
        )}
      </div>
    </div>
  )
}
