'use client'

import React from 'react'
import Image from 'next/image'
import { ProfileImage, ImageLayout } from '../types'

interface ImageGalleryDisplayProps {
  images: ProfileImage[]
  layout: ImageLayout
}

export default function ImageGalleryDisplay({
  images,
  layout,
}: ImageGalleryDisplayProps) {
  if (images.length === 0) {
    return null
  }

  const sortedImages = [...images].sort((a, b) => a.order - b.order)

  const getGridClass = () => {
    switch (layout) {
      case 'single':
        return 'grid-cols-1'
      case 'double':
        return 'grid-cols-1 sm:grid-cols-2'
      case 'grid':
        return 'grid-cols-2 sm:grid-cols-3'
      default:
        return 'grid-cols-1 sm:grid-cols-2'
    }
  }

  const getAspectRatio = () => {
    switch (layout) {
      case 'single':
        return 'aspect-[16/9]'
      case 'double':
        return 'aspect-[4/3]'
      case 'grid':
        return 'aspect-square'
      default:
        return 'aspect-[4/3]'
    }
  }

  return (
    <div className={`grid gap-3 ${getGridClass()}`}>
      {sortedImages.map((image) => (
        <div key={image.id} className="overflow-hidden rounded-lg bg-gray-100">
          <div className={`relative w-full ${getAspectRatio()}`}>
            <Image
              src={image.url}
              alt={image.caption || '攀岩照片'}
              fill
              className="object-cover"
              sizes={
                layout === 'single'
                  ? '100vw'
                  : layout === 'double'
                    ? '(max-width: 640px) 100vw, 50vw'
                    : '(max-width: 640px) 50vw, 33vw'
              }
            />
          </div>
          {image.caption && (
            <p className="p-2 text-sm text-gray-600">{image.caption}</p>
          )}
        </div>
      ))}
    </div>
  )
}
