'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { BiographyV2, GalleryImage } from '@/lib/types/biography-v2'

interface BiographyGalleryProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 初始顯示的圖片數量 */
  initialCount?: number
  /** 自訂樣式 */
  className?: string
}

/**
 * 相簿展示組件
 *
 * 顯示用戶上傳的攀岩照片
 */
export function BiographyGallery({
  biography,
  initialCount = 6,
  className,
}: BiographyGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const images = biography.gallery_images || []

  if (images.length === 0) {
    return null
  }

  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📸</span>
        <h2 className="text-lg font-semibold text-gray-900">攀岩日常</h2>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {images.slice(0, initialCount).map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
            <Image
              src={image.url}
              alt={image.caption || `攀岩照片 ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}

        {/* View All Button */}
        {images.length > initialCount && (
          <button
            onClick={() => setSelectedImage(images[initialCount])}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <span className="text-primary font-medium">
              查看全部 ({images.length})
            </span>
          </button>
        )}
      </div>

      {/* Mobile Horizontal Scroll */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden"
            >
              <Image
                src={image.url}
                alt={image.caption || `攀岩照片 ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {images.length > 4 && (
          <div className="text-center mt-3">
            <button
              onClick={() => setSelectedImage(images[0])}
              className="text-sm text-primary font-medium"
            >
              查看全部相簿
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setSelectedImage(null)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="relative max-w-4xl max-h-[80vh] w-full mx-4">
            <Image
              src={selectedImage.url}
              alt={selectedImage.caption || '攀岩照片'}
              width={1200}
              height={800}
              className="object-contain w-full h-full"
            />
            {selectedImage.caption && (
              <p className="absolute bottom-4 left-4 right-4 text-center text-white/90 text-sm">
                {selectedImage.caption}
              </p>
            )}
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white/80 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  const currentIndex = images.findIndex(
                    (img) => img.id === selectedImage.id
                  )
                  const prevIndex =
                    currentIndex === 0 ? images.length - 1 : currentIndex - 1
                  setSelectedImage(images[prevIndex])
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                className="absolute right-4 text-white/80 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  const currentIndex = images.findIndex(
                    (img) => img.id === selectedImage.id
                  )
                  const nextIndex =
                    currentIndex === images.length - 1 ? 0 : currentIndex + 1
                  setSelectedImage(images[nextIndex])
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default BiographyGallery
