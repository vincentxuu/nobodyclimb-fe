'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { galleryService } from '@/lib/api/services'
import type { GalleryPhoto } from '@/lib/types'

// 定義顯示用的照片類型
interface DisplayPhoto {
  id: string
  image: string
  alt: string
  location: {
    city?: string
    spot?: string
  }
  aspectRatio: 'tall' | 'square' | 'wide'
}

// 根據索引決定 aspectRatio 實現瀑布流效果
function getAspectRatio(index: number): 'tall' | 'square' | 'wide' {
  const patterns: ('tall' | 'square' | 'wide')[] = ['tall', 'square', 'wide', 'square', 'tall', 'square', 'wide', 'square']
  return patterns[index % patterns.length]
}

// 將 API 資料轉換為顯示用的格式
function transformPhoto(photo: GalleryPhoto, index: number): DisplayPhoto {
  return {
    id: photo.id,
    image: photo.thumbnail_url || photo.image_url,
    alt: photo.caption || `攝影集精選照片 ${index + 1}`,
    location: {
      city: photo.location_city,
      spot: photo.location_spot,
    },
    aspectRatio: getAspectRatio(index),
  }
}

// 照片卡片組件
function PhotoCard({ photo, index }: { photo: DisplayPhoto; index: number }) {
  // 根據 aspectRatio 決定高度
  const heightClass = {
    tall: 'h-[380px]',
    square: 'h-[260px]',
    wide: 'h-[200px]',
  }[photo.aspectRatio]

  return (
    <motion.div
      className={`group relative w-full overflow-hidden rounded-lg ${heightClass}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Image
        src={photo.image}
        alt={photo.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      {/* 漸層遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* 位置資訊 */}
      {(photo.location.city || photo.location.spot) && (
        <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex items-center gap-2 text-white">
            <MapPin size={16} className="flex-shrink-0" />
            <span className="text-sm font-medium">
              {[photo.location.city, photo.location.spot].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Loading skeleton 組件
function PhotoSkeleton({ index }: { index: number }) {
  const heightClass = {
    tall: 'h-[380px]',
    square: 'h-[260px]',
    wide: 'h-[200px]',
  }[getAspectRatio(index)]

  return (
    <div className={`w-full overflow-hidden rounded-lg bg-gray-200 ${heightClass} animate-pulse`} />
  )
}

/**
 * 攝影集精選區組件
 * 使用 CSS Columns 實現 Masonry 瀑布流效果
 * 從 API 獲取最新照片
 */
export function GallerySection() {
  const [photos, setPhotos] = useState<DisplayPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const response = await galleryService.getPhotos(1, 8)
        if (response.success && response.data) {
          const transformedPhotos = response.data.map((photo, index) => transformPhoto(photo, index))
          setPhotos(transformedPhotos)
        }
      } catch (error) {
        console.error('Failed to fetch gallery photos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPhotos()
  }, [])

  return (
    <section className="border-t border-[#D2D2D2] py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* 標題區 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">攝影集精選</h2>
            <p className="mt-2 text-base text-[#6D6C6C]">看看小人物們攀岩的英姿吧</p>
          </div>
        </div>

        {/* Masonry Grid - 使用 CSS Columns */}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="mb-4 break-inside-avoid">
                <PhotoSkeleton index={index} />
              </div>
            ))
            : photos.map((photo, index) => (
              <div key={photo.id} className="mb-4 break-inside-avoid">
                <PhotoCard photo={photo} index={index} />
              </div>
            ))}
        </div>

        {/* 查看全部按鈕 */}
        <div className="mt-10 flex justify-center">
          <Link href="/gallery">
            <Button
              variant="outline"
              className="h-11 border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8]"
            >
              看更多影像
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
