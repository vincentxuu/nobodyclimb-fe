'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 照片資料（包含不同尺寸以實現 Masonry 效果）
const photos = [
  {
    id: 1,
    image: '/images/gallery/gallery-1.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞',
    },
    aspectRatio: 'tall', // 高圖
  },
  {
    id: 2,
    image: '/images/gallery/gallery-2.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞',
    },
    aspectRatio: 'square', // 正方形
  },
  {
    id: 3,
    image: '/images/gallery/gallery-3.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞',
    },
    aspectRatio: 'wide', // 寬圖
  },
  {
    id: 4,
    image: '/images/gallery/gallery-4.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞',
    },
    aspectRatio: 'square',
  },
  {
    id: 5,
    image: '/images/gallery/gallery-5.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞',
    },
    aspectRatio: 'tall',
  },
  {
    id: 6,
    image: '/images/gallery/gallery-6.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞',
    },
    aspectRatio: 'square',
  },
  {
    id: 7,
    image: '/images/gallery/gallery-1.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞',
    },
    aspectRatio: 'wide',
  },
  {
    id: 8,
    image: '/images/gallery/gallery-2.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞',
    },
    aspectRatio: 'square',
  },
]

// 照片卡片組件
function PhotoCard({ photo, index }: { photo: (typeof photos)[0]; index: number }) {
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
        alt={`攀岩照片 ${photo.id}`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* 漸層遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* 位置資訊 */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 transition-transform duration-300 group-hover:translate-y-0">
        <div className="flex items-center gap-2 text-white">
          <MapPin size={16} className="flex-shrink-0" />
          <span className="text-sm font-medium">
            {photo.location.city} · {photo.location.spot}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * 相片集精選區組件
 * 使用 CSS Columns 實現 Masonry 瀑布流效果
 */
export function GallerySection() {
  return (
    <section className="border-t border-[#D2D2D2] py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* 標題區 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">相片集精選</h2>
            <p className="mt-2 text-base text-[#6D6C6C]">看看小人物們攀岩的英姿吧</p>
          </div>
          <Link
            href="/gallery"
            className="hidden items-center gap-2 text-sm font-medium text-[#1B1A1A] hover:text-[#6D6C6C] md:flex"
          >
            查看全部
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Masonry Grid - 使用 CSS Columns */}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {photos.map((photo, index) => (
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
