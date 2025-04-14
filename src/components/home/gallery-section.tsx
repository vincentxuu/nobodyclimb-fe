'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 照片資料
const photos = [
  {
    id: 1,
    image: '/images/gallery/gallery-1.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞'
    }
  },
  {
    id: 2,
    image: '/images/gallery/gallery-2.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞'
    }
  },
  {
    id: 3,
    image: '/images/gallery/gallery-3.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞'
    }
  },
  {
    id: 4,
    image: '/images/gallery/gallery-4.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞'
    }
  },
  {
    id: 5,
    image: '/images/gallery/gallery-5.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞'
    }
  },
  {
    id: 6,
    image: '/images/gallery/gallery-6.jpg',
    location: {
      country: '台灣',
      city: '新北市',
      spot: '龍洞'
    }
  }
]

function PhotoCard({ photo, index }: { photo: typeof photos[0], index: number }) {
  return (
    <motion.div 
      className="group relative aspect-square overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Image
        src={photo.image}
        alt={`攀岩照片 ${photo.id}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* 漸層遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* 位置資訊 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
        <div className="flex items-center gap-2 text-white">
          <MapPin size={16} className="text-white" />
          <span className="text-sm font-medium tracking-[0.02em] font-['Noto_Sans_TC']">{photo.location.country}</span>
          <span className="text-sm font-medium tracking-[0.02em] font-['Noto_Sans_TC']">{photo.location.city}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
          <span className="text-sm font-medium tracking-[0.02em] font-['Noto_Sans_TC']">{photo.location.spot}</span>
        </div>
      </div>
    </motion.div>
  )
}

export function GallerySection() {
  return (
    <section className="py-16 md:py-20 border-t border-[#D2D2D2]">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-[40px] font-bold text-[#1B1A1A] font-['Noto_Sans_TC']">
            精選影像
          </h2>
          <p className="text-base font-normal text-[#6D6C6C] mt-4 tracking-[0.01em] font-['Noto_Sans_CJK_TC']">
            看看小人物們攀岩的英姿吧
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {photos.map((photo, index) => (
            <PhotoCard key={photo.id} photo={photo} index={index} />
          ))}
        </div>
        
        <div className="mt-10 flex justify-center">
          <Link href="/photoalbum">
            <Button 
              variant="outline" 
              className="h-11 rounded-none border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8] font-['Noto_Sans_TC'] tracking-[0.02em]"
            >
              看更多影像
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
